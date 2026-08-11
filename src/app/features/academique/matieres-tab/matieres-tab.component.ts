import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { Matiere, Section } from '../../../core/models/academique.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import {
  MatiereFormDialogComponent,
  MatiereFormDialogData,
} from '../dialogs/matiere-form-dialog/matiere-form-dialog.component';

@Component({
  selector: 'app-matieres-tab',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatTooltipModule],
  templateUrl: './matieres-tab.component.html',
})
export class MatieresTabComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly matieres = signal<Matiere[]>([]);
  protected readonly sections = signal<Section[]>([]);
  protected readonly displayedColumns = ['nom', 'code', 'section', 'actions'];

  ngOnInit(): void {
    this.academiqueService.sections().subscribe((res) => this.sections.set(res.data));
    this.charger();
  }

  charger(): void {
    this.academiqueService.matieres().subscribe((res) => this.matieres.set(res.data));
  }

  ouvrirCreation(): void {
    const ref = this.dialog.open(MatiereFormDialogComponent, {
      data: { mode: 'create', sections: this.sections() } as MatiereFormDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.academiqueService.creerMatiere(result).subscribe({
        next: () => {
          this.snackBar.open('Matière créée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirEdition(matiere: Matiere): void {
    const ref = this.dialog.open(MatiereFormDialogComponent, {
      data: { mode: 'edit', matiere, sections: this.sections() } as MatiereFormDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.academiqueService.modifierMatiere(matiere.id, result).subscribe({
        next: () => {
          this.snackBar.open('Matière modifiée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  supprimer(matiere: Matiere): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer cette matière',
        message: `Confirmez-vous la suppression de ${matiere.nom} ?`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.academiqueService.supprimerMatiere(matiere.id).subscribe({
        next: () => {
          this.snackBar.open('Matière supprimée.', 'Fermer', { duration: 3000 });
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
