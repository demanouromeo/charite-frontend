import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { AnneeScolaire } from '../../../core/models/academique.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { AnneeFormDialogComponent } from '../dialogs/annee-form-dialog/annee-form-dialog.component';

@Component({
  selector: 'app-annees-tab',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatTooltipModule],
  templateUrl: './annees-tab.component.html',
})
export class AnneesTabComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly isAdmin = computed(() => this.authService.hasRole('administrateur'));
  protected readonly displayedColumns = ['libelle', 'date_debut', 'date_fin', 'statut', 'actions'];

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => this.annees.set(res.data));
  }

  ouvrirCreation(): void {
    const ref = this.dialog.open(AnneeFormDialogComponent);
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.academiqueService.creerAnneeScolaire(result).subscribe({
        next: () => {
          this.snackBar.open('Année scolaire créée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  activer(annee: AnneeScolaire): void {
    this.academiqueService.activerAnneeScolaire(annee.id).subscribe({
      next: () => {
        this.snackBar.open(`${annee.libelle} est maintenant l'année active.`, 'Fermer', { duration: 3000 });
        this.charger();
      },
      error: (err) => this.afficherErreur(err),
    });
  }

  supprimer(annee: AnneeScolaire): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer cette année scolaire',
        message: `Confirmez-vous la suppression de ${annee.libelle} ? Les classes instanciées pour cette année seront également supprimées.`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.academiqueService.supprimerAnneeScolaire(annee.id).subscribe({
        next: () => {
          this.snackBar.open('Année scolaire supprimée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  private afficherErreur(err: any): void {
    this.snackBar.open(err.error?.message ?? 'Une erreur est survenue.', 'Fermer', { duration: 4000 });
  }
}
