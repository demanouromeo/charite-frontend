import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { Classe, Section } from '../../../core/models/academique.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import {
  ClasseFormDialogComponent,
  ClasseFormDialogData,
} from '../dialogs/classe-form-dialog/classe-form-dialog.component';

@Component({
  selector: 'app-classes-tab',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatIconModule, MatDialogModule, MatTooltipModule, MatProgressSpinnerModule],
  templateUrl: './classes-tab.component.html',
})
export class ClassesTabComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly classes = signal<Classe[]>([]);
  protected readonly sections = signal<Section[]>([]);
  protected readonly chargementSections = signal(false);
  protected readonly isAdmin = computed(() => this.authService.hasRole('administrateur'));
  protected readonly displayedColumns = ['nom', 'niveau', 'section', 'actions'];

  ngOnInit(): void {
    this.chargementSections.set(true);
    this.academiqueService.sections().subscribe((res) => {
      this.sections.set(res.data);
      this.chargementSections.set(false);
    });
    this.charger();
  }

  charger(): void {
    this.academiqueService.classes().subscribe((res) => this.classes.set(res.data));
  }

  ouvrirCreation(): void {
    const ref = this.dialog.open(ClasseFormDialogComponent, {
      data: { mode: 'create', sections: this.sections() } as ClasseFormDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.academiqueService.creerClasse(result).subscribe({
        next: () => {
          this.snackBar.open('Classe créée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirEdition(classe: Classe): void {
    const ref = this.dialog.open(ClasseFormDialogComponent, {
      data: { mode: 'edit', classe, sections: this.sections() } as ClasseFormDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.academiqueService.modifierClasse(classe.id, result).subscribe({
        next: () => {
          this.snackBar.open('Classe modifiée.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  supprimer(classe: Classe): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer cette classe',
        message: `Confirmez-vous la suppression de ${classe.nom} ?`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.academiqueService.supprimerClasse(classe.id).subscribe({
        next: () => {
          this.snackBar.open('Classe supprimée.', 'Fermer', { duration: 3000 });
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
