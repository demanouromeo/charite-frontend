import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { ScolariteService } from '../../../core/services/scolarite.service';
import { AnneeScolaire, ClasseAnnee } from '../../../core/models/academique.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { telechargerBlob } from '../../../shared/telecharger-blob';
import { EnseignantDialogComponent, EnseignantDialogData } from '../dialogs/enseignant-dialog/enseignant-dialog.component';
import {
  MatieresCoeffDialogComponent,
  MatieresCoeffDialogData,
} from '../dialogs/matieres-coeff-dialog/matieres-coeff-dialog.component';

@Component({
  selector: 'app-classes-annee-tab',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './classes-annee-tab.component.html',
  styleUrl: './classes-annee-tab.component.scss',
})
export class ClasseAnneeTabComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly scolariteService = inject(ScolariteService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly loading = signal(false);
  protected readonly chargementAnnees = signal(false);
  protected readonly chargementMatieres = signal<number | null>(null);
  protected readonly impressionInsolvablesId = signal<number | null>(null);
  protected readonly impressionEffectifs = signal(false);
  protected readonly isAdmin = computed(() => this.authService.hasRole('administrateur'));
  protected readonly peutImprimerInsolvables = computed(() => this.authService.hasRole('administrateur', 'econome'));
  protected readonly peutImprimerEffectifs = computed(() =>
    this.authService.hasRole('administrateur', 'econome', 'secretaire'),
  );
  protected readonly displayedColumns = ['classe', 'effectif', 'enseignant', 'matieres', 'actions'];

  ngOnInit(): void {
    this.rafraichirAnnees();
  }

  /**
   * Recharge la liste des années scolaires (ex: après création/activation depuis l'onglet
   * "Années scolaires") en conservant la sélection courante si elle existe toujours.
   */
  rafraichirAnnees(): void {
    this.chargementAnnees.set(true);
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      this.chargementAnnees.set(false);
      const selectionEncoreValide = res.data.some((a) => a.id === this.anneeSelectionneeId());
      const cible = selectionEncoreValide
        ? this.anneeSelectionneeId()
        : (res.data.find((a) => a.is_active) ?? res.data[0])?.id ?? null;

      this.anneeSelectionneeId.set(cible);
      if (cible) this.charger();
    });
  }

  charger(): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    this.loading.set(true);
    this.academiqueService.classesAnnee(anneeId).subscribe({
      next: (res) => {
        this.classesAnnee.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  genererClasses(): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    this.academiqueService.genererClassesAnnee(anneeId).subscribe({
      next: (res) => {
        this.snackBar.open(res.message, 'Fermer', { duration: 3000 });
        this.charger();
      },
      error: (err) => this.afficherErreur(err),
    });
  }

  modifierEffectif(classeAnnee: ClasseAnnee, valeur: string): void {
    const effectif = valeur ? Number(valeur) : null;
    this.academiqueService.modifierEffectif(classeAnnee.id, effectif).subscribe({
      next: () => this.snackBar.open('Effectif maximum mis à jour.', 'Fermer', { duration: 2500 }),
      error: (err) => this.afficherErreur(err),
    });
  }

  ouvrirAffectationEnseignant(classeAnnee: ClasseAnnee): void {
    const ref = this.dialog.open(EnseignantDialogComponent, { data: { classeAnnee } as EnseignantDialogData });
    ref.afterClosed().subscribe((enseignantId: number | null) => {
      if (!enseignantId) return;
      this.academiqueService.assignerEnseignant(classeAnnee.id, enseignantId).subscribe({
        next: () => {
          this.snackBar.open('Enseignant affecté.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  retirerEnseignant(classeAnnee: ClasseAnnee): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: "Retirer l'enseignant",
        message: `Retirer ${classeAnnee.enseignant_principal?.nom_complet} de ${classeAnnee.classe.nom} ?`,
        confirmLabel: 'Retirer',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.academiqueService.retirerEnseignant(classeAnnee.id).subscribe({
        next: () => {
          this.snackBar.open('Enseignant retiré.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirMatieres(classeAnnee: ClasseAnnee): void {
    this.chargementMatieres.set(classeAnnee.id);
    this.academiqueService.matieres(classeAnnee.classe.section.id).subscribe((res) => {
      this.chargementMatieres.set(null);
      const ref = this.dialog.open(MatieresCoeffDialogComponent, {
        data: { classeAnnee, matieresDisponibles: res.data } as MatieresCoeffDialogData,
      });
      ref.afterClosed().subscribe((matieres) => {
        if (!matieres) return;
        this.academiqueService.syncMatieres(classeAnnee.id, matieres).subscribe({
          next: () => {
            this.snackBar.open('Matières et coefficients enregistrés.', 'Fermer', { duration: 3000 });
            this.charger();
          },
          error: (err) => this.afficherErreur(err),
        });
      });
    });
  }

  imprimerInsolvables(classeAnnee: ClasseAnnee): void {
    this.impressionInsolvablesId.set(classeAnnee.id);
    this.scolariteService.insolvablesPdf(classeAnnee.id).subscribe({
      next: (blob) => {
        telechargerBlob(blob, `insolvables-${classeAnnee.classe.nom}.pdf`);
        this.impressionInsolvablesId.set(null);
      },
      error: (err) => {
        this.afficherErreur(err);
        this.impressionInsolvablesId.set(null);
      },
    });
  }

  imprimerEffectifs(): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    this.impressionEffectifs.set(true);
    this.academiqueService.effectifsPdf(anneeId).subscribe({
      next: (blob) => {
        telechargerBlob(blob, 'effectifs.pdf');
        this.impressionEffectifs.set(false);
      },
      error: (err) => {
        this.afficherErreur(err);
        this.impressionEffectifs.set(false);
      },
    });
  }

  private afficherErreur(err: any): void {
    const message = err.error?.errors?.enseignant_id?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
