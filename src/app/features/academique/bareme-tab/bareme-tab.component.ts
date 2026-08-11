import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { ScolariteService } from '../../../core/services/scolarite.service';
import { AnneeScolaire, Classe } from '../../../core/models/academique.model';
import { FraisScolarite } from '../../../core/models/scolarite.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import {
  BaremeFormDialogComponent,
  BaremeFormDialogData,
} from '../dialogs/bareme-form-dialog/bareme-form-dialog.component';

@Component({
  selector: 'app-bareme-tab',
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
  ],
  templateUrl: './bareme-tab.component.html',
  styleUrl: './bareme-tab.component.scss',
})
export class BaremeTabComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly scolariteService = inject(ScolariteService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly classes = signal<Classe[]>([]);
  protected readonly baremes = signal<FraisScolarite[]>([]);
  protected readonly loading = signal(false);
  protected readonly displayedColumns = ['classe', 'montant_total', 'tranches', 'actions'];

  protected readonly peutGerer = computed(() => this.authService.hasRole('administrateur', 'econome'));

  ngOnInit(): void {
    this.academiqueService.classes().subscribe((res) => this.classes.set(res.data));
    this.rafraichirAnnees();
  }

  rafraichirAnnees(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
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
    this.scolariteService.baremes(anneeId).subscribe({
      next: (res) => {
        this.baremes.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  baremePour(classe: Classe): FraisScolarite | undefined {
    return this.baremes().find((b) => b.classe.id === classe.id);
  }

  ouvrirCreation(classe: Classe): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    const ref = this.dialog.open(BaremeFormDialogComponent, { data: { mode: 'create', classe } as BaremeFormDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.scolariteService.creerBareme({ classe_id: classe.id, annee_scolaire_id: anneeId, ...result }).subscribe({
        next: () => {
          this.snackBar.open('Barème créé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirEdition(classe: Classe, bareme: FraisScolarite): void {
    const ref = this.dialog.open(BaremeFormDialogComponent, { data: { mode: 'edit', classe, bareme } as BaremeFormDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.scolariteService.modifierBareme(bareme.id, result).subscribe({
        next: () => {
          this.snackBar.open('Barème mis à jour.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  supprimer(bareme: FraisScolarite): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer ce barème',
        message: `Confirmez-vous la suppression du barème de ${bareme.classe.nom} ?`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.scolariteService.supprimerBareme(bareme.id).subscribe({
        next: () => {
          this.snackBar.open('Barème supprimé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  private afficherErreur(err: any): void {
    const message = err.error?.errors?.montant_total?.[0] ?? err.error?.errors?.classe_id?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
