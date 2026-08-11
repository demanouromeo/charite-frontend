import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/services/auth.service';
import { PersonnelService } from '../../../core/services/personnel.service';
import { Role, User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { telechargerBlob } from '../../../shared/telecharger-blob';
import { TableSkeletonComponent } from '../../../shared/table-skeleton/table-skeleton.component';
import {
  PersonnelFormDialogComponent,
  PersonnelFormDialogData,
} from '../personnel-form-dialog/personnel-form-dialog.component';

const ROLE_LABELS: Partial<Record<string, string>> = {
  administrateur: 'Administrateur',
  econome: 'Économe',
  secretaire: 'Secrétaire',
  enseignant: 'Enseignant',
};

@Component({
  selector: 'app-personnel-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSelectModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    TableSkeletonComponent,
  ],
  templateUrl: './personnel-list.component.html',
  styleUrl: './personnel-list.component.scss',
})
export class PersonnelListComponent implements OnInit {
  private readonly personnelService = inject(PersonnelService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roleFilter = signal<string>('');
  protected readonly personnel = signal<User[]>([]);
  protected readonly loading = signal(false);
  protected readonly impression = signal(false);
  protected readonly displayedColumns = ['matricule', 'nom_complet', 'email', 'telephone', 'roles', 'statut', 'actions'];

  protected readonly isAdmin = computed(() => this.authService.hasRole('administrateur'));
  protected readonly peutImprimer = computed(() => this.authService.hasRole('administrateur', 'econome', 'secretaire'));

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.personnelService.list(this.roleFilter() ? { role: this.roleFilter() } : {}).subscribe({
      next: (res) => {
        this.personnel.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  peutModifier(user: User): boolean {
    if (this.isAdmin()) return true;
    return this.authService.hasRole('secretaire') && user.roles.includes('enseignant');
  }

  ouvrirCreation(): void {
    const ref = this.dialog.open(PersonnelFormDialogComponent, { data: { mode: 'create' } as PersonnelFormDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.personnelService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Membre du personnel créé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirEdition(user: User): void {
    const ref = this.dialog.open(PersonnelFormDialogComponent, { data: { mode: 'edit', user } as PersonnelFormDialogData });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const { role, password, ...payload } = result;
      this.personnelService.update(user.id, payload).subscribe({
        next: () => {
          this.snackBar.open('Informations mises à jour.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  changerRole(user: User, role: Role): void {
    this.personnelService.updateRole(user.id, role).subscribe({
      next: () => {
        this.snackBar.open('Rôle mis à jour.', 'Fermer', { duration: 3000 });
        this.charger();
      },
      error: (err) => this.afficherErreur(err),
    });
  }

  basculerStatut(user: User): void {
    const nouveauStatut = user.statut === 'actif' ? 'inactif' : 'actif';
    this.personnelService.updateStatut(user.id, nouveauStatut).subscribe({
      next: () => {
        this.snackBar.open(`Compte ${nouveauStatut === 'actif' ? 'activé' : 'désactivé'}.`, 'Fermer', { duration: 3000 });
        this.charger();
      },
      error: (err) => this.afficherErreur(err),
    });
  }

  supprimer(user: User): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer ce membre du personnel',
        message: `Confirmez-vous la suppression de ${user.nom_complet} ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.personnelService.delete(user.id).subscribe({
        next: () => {
          this.snackBar.open('Membre du personnel supprimé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  imprimerListe(): void {
    this.impression.set(true);
    this.personnelService.listePdf(this.roleFilter() ? { role: this.roleFilter() } : {}).subscribe({
      next: (blob) => {
        telechargerBlob(blob, 'liste-personnel.pdf');
        this.impression.set(false);
      },
      error: (err) => {
        this.afficherErreur(err);
        this.impression.set(false);
      },
    });
  }

  private afficherErreur(err: any): void {
    const message = err.error?.message ?? "Une erreur est survenue.";
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
