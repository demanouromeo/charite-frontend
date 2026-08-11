import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { EleveService } from '../../../core/services/eleve.service';
import { AnneeScolaire, ClasseAnnee } from '../../../core/models/academique.model';
import { Eleve } from '../../../core/models/eleve.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { telechargerBlob } from '../../../shared/telecharger-blob';
import { TableSkeletonComponent } from '../../../shared/table-skeleton/table-skeleton.component';
import { EleveFormDialogComponent, EleveFormDialogData } from '../eleve-form-dialog/eleve-form-dialog.component';
import {
  EleveExclusionDialogComponent,
  EleveExclusionDialogData,
} from '../eleve-exclusion-dialog/eleve-exclusion-dialog.component';
import {
  EleveScolariteDialogComponent,
  EleveScolariteDialogData,
} from '../eleve-scolarite-dialog/eleve-scolarite-dialog.component';
import {
  EleveBulletinsDialogComponent,
  EleveBulletinsDialogData,
} from '../eleve-bulletins-dialog/eleve-bulletins-dialog.component';

const STATUT_LABELS: Record<string, string> = {
  actif: 'Actif',
  exclu: 'Exclu',
  parti: 'Parti',
};

@Component({
  selector: 'app-eleves-list',
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
    TableSkeletonComponent,
  ],
  templateUrl: './eleves-list.component.html',
  styleUrl: './eleves-list.component.scss',
})
export class ElevesListComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly eleveService = inject(EleveService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly statutLabels = STATUT_LABELS;
  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly classeAnneeSelectionneeId = signal<number | null>(null);
  protected readonly statutFiltre = signal<string>('');
  protected readonly recherche = signal<string>('');
  protected readonly eleves = signal<Eleve[]>([]);
  protected readonly loading = signal(false);
  protected readonly impression = signal(false);
  protected readonly displayedColumns = ['matricule', 'nom_complet', 'sexe', 'classe', 'statut', 'actions'];

  protected readonly peutCreer = computed(() => this.authService.hasRole('administrateur', 'econome'));
  protected readonly peutModifier = computed(() => this.authService.hasRole('administrateur', 'econome', 'secretaire'));
  protected readonly peutExclure = computed(() => this.authService.hasRole('administrateur'));
  protected readonly peutSupprimer = computed(() => this.authService.hasRole('administrateur'));
  protected readonly peutImprimer = computed(() => this.authService.hasRole('administrateur', 'econome', 'secretaire'));
  protected readonly peutGererScolarite = computed(() => this.authService.hasRole('administrateur', 'econome'));
  protected readonly peutImprimerBulletins = computed(() => this.authService.hasRole('administrateur', 'secretaire'));

  ngOnInit(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      const active = res.data.find((a) => a.is_active) ?? res.data[0];
      if (active) {
        this.anneeSelectionneeId.set(active.id);
        this.chargerClasses(active.id);
      }
      this.charger();
    });
  }

  onAnneeChange(anneeId: number | null): void {
    this.anneeSelectionneeId.set(anneeId);
    this.classeAnneeSelectionneeId.set(null);
    this.classesAnnee.set([]);
    if (anneeId) this.chargerClasses(anneeId);
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.eleveService
      .list({
        annee_scolaire_id: this.anneeSelectionneeId() ?? undefined,
        classe_annee_id: this.classeAnneeSelectionneeId() ?? undefined,
        statut: this.statutFiltre() || undefined,
        recherche: this.recherche() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.eleves.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  classeLabel(eleve: Eleve): string {
    const classe = eleve.inscription_courante?.classe_annee?.classe;
    return classe ? `${classe.nom} (${classe.section.code})` : '—';
  }

  ouvrirCreation(): void {
    const ref = this.dialog.open(EleveFormDialogComponent, { data: { mode: 'create' } as EleveFormDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.eleveService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Élève inscrit.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirEdition(eleve: Eleve): void {
    const ref = this.dialog.open(EleveFormDialogComponent, { data: { mode: 'edit', eleve } as EleveFormDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.eleveService.update(eleve.id, result).subscribe({
        next: () => {
          this.snackBar.open('Informations mises à jour.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  exclure(eleve: Eleve): void {
    const ref = this.dialog.open(EleveExclusionDialogComponent, { data: { eleve } as EleveExclusionDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.eleveService.exclure(eleve.id, result).subscribe({
        next: () => {
          this.snackBar.open('Élève exclu.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  reintegrer(eleve: Eleve): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Réintégrer cet élève',
        message: `Réintégrer ${eleve.nom_complet} parmi les élèves actifs ?`,
        confirmLabel: 'Réintégrer',
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.eleveService.reintegrer(eleve.id).subscribe({
        next: () => {
          this.snackBar.open('Élève réintégré.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  supprimer(eleve: Eleve): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer cet élève',
        message: `Confirmez-vous la suppression de ${eleve.nom_complet} ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.eleveService.delete(eleve.id).subscribe({
        next: () => {
          this.snackBar.open('Élève supprimé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirScolarite(eleve: Eleve): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    const anneeLibelle = this.annees().find((a) => a.id === anneeId)?.libelle ?? '';
    this.dialog.open(EleveScolariteDialogComponent, {
      data: { eleve, anneeScolaireId: anneeId, anneeLibelle } as EleveScolariteDialogData,
      minWidth: 620,
    });
  }

  ouvrirBulletins(eleve: Eleve): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    const anneeLibelle = this.annees().find((a) => a.id === anneeId)?.libelle ?? '';
    this.dialog.open(EleveBulletinsDialogComponent, {
      data: { eleve, anneeScolaireId: anneeId, anneeLibelle } as EleveBulletinsDialogData,
      minWidth: 460,
    });
  }

  imprimerListe(): void {
    this.impression.set(true);
    this.eleveService
      .listePdf({
        annee_scolaire_id: this.anneeSelectionneeId() ?? undefined,
        classe_annee_id: this.classeAnneeSelectionneeId() ?? undefined,
        statut: this.statutFiltre() || undefined,
      })
      .subscribe({
        next: (blob) => {
          telechargerBlob(blob, 'liste-eleves.pdf');
          this.impression.set(false);
        },
        error: (err) => {
          this.afficherErreur(err);
          this.impression.set(false);
        },
      });
  }

  private chargerClasses(anneeId: number): void {
    this.academiqueService.classesAnnee(anneeId).subscribe((res) => this.classesAnnee.set(res.data));
  }

  private afficherErreur(err: any): void {
    const message = err.error?.errors?.classe_annee_id?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
