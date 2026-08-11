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
import { AuthService } from '../../../core/services/auth.service';
import { PaieService } from '../../../core/services/paie.service';
import { PersonnelService } from '../../../core/services/personnel.service';
import { Salaire } from '../../../core/models/salaire.model';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog/confirm-dialog.component';
import { telechargerBlob } from '../../../shared/telecharger-blob';
import { TableSkeletonComponent } from '../../../shared/table-skeleton/table-skeleton.component';
import { PaieFormDialogComponent, PaieFormDialogData } from '../paie-form-dialog/paie-form-dialog.component';

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

@Component({
  selector: 'app-paie-list',
  standalone: true,
  imports: [
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    TableSkeletonComponent,
  ],
  templateUrl: './paie-list.component.html',
  styleUrl: './paie-list.component.scss',
})
export class PaieListComponent implements OnInit {
  private readonly paieService = inject(PaieService);
  private readonly personnelService = inject(PersonnelService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly moisLabels = MOIS_LABELS;
  protected readonly anneeFilter = signal<number>(new Date().getFullYear());
  protected readonly moisFilter = signal<number | ''>('');
  protected readonly statutFilter = signal<'' | 'paye' | 'non_paye'>('');
  protected readonly salaires = signal<Salaire[]>([]);
  protected readonly personnel = signal<User[]>([]);
  protected readonly loading = signal(false);
  protected readonly enregistrementId = signal<number | null>(null);
  protected readonly displayedColumns = [
    'personnel', 'periode', 'salaire_base', 'primes', 'retenues', 'montant_net', 'statut', 'actions',
  ];

  protected readonly isAdmin = computed(() => this.authService.hasRole('administrateur'));

  ngOnInit(): void {
    this.personnelService.list({ statut: 'actif' }).subscribe((res) => this.personnel.set(res.data));
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.paieService
      .list({
        annee: this.anneeFilter() || undefined,
        mois: this.moisFilter() || undefined,
        statut: this.statutFilter() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.salaires.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  peutModifier(salaire: Salaire): boolean {
    return salaire.statut === 'non_paye' || this.isAdmin();
  }

  ouvrirCreation(): void {
    const ref = this.dialog.open(PaieFormDialogComponent, {
      data: { mode: 'create', personnel: this.personnel() } as PaieFormDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      this.paieService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Salaire enregistré.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  ouvrirEdition(salaire: Salaire): void {
    const ref = this.dialog.open(PaieFormDialogComponent, {
      data: { mode: 'edit', personnel: this.personnel(), salaire } as PaieFormDialogData,
    });
    ref.afterClosed().subscribe((result) => {
      if (!result) return;
      const { salaire_base, primes, retenues } = result;
      this.paieService.update(salaire.id, { salaire_base, primes, retenues }).subscribe({
        next: () => {
          this.snackBar.open('Salaire mis à jour.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  payer(salaire: Salaire): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Marquer ce salaire comme payé',
        message: `Confirmez-vous le paiement de ${salaire.montant_net} FCFA à ${salaire.user?.nom_complet} pour ${salaire.mois_libelle} ${salaire.annee} ?`,
        confirmLabel: 'Payer',
      },
    });

    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.paieService.payer(salaire.id).subscribe({
        next: () => {
          this.snackBar.open('Salaire marqué comme payé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  supprimer(salaire: Salaire): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Supprimer ce salaire',
        message: `Confirmez-vous la suppression du salaire de ${salaire.user?.nom_complet} pour ${salaire.mois_libelle} ${salaire.annee} ? Cette action est irréversible.`,
        confirmLabel: 'Supprimer',
        danger: true,
      },
    });

    ref.afterClosed().subscribe((confirme) => {
      if (!confirme) return;
      this.paieService.delete(salaire.id).subscribe({
        next: () => {
          this.snackBar.open('Salaire supprimé.', 'Fermer', { duration: 3000 });
          this.charger();
        },
        error: (err) => this.afficherErreur(err),
      });
    });
  }

  imprimerBulletin(salaire: Salaire): void {
    this.enregistrementId.set(salaire.id);
    this.paieService.bulletinPdf(salaire.id).subscribe({
      next: (blob) => {
        telechargerBlob(blob, `bulletin-paie-${salaire.user?.matricule}-${salaire.mois}-${salaire.annee}.pdf`);
        this.enregistrementId.set(null);
      },
      error: (err) => {
        this.afficherErreur(err);
        this.enregistrementId.set(null);
      },
    });
  }

  private afficherErreur(err: any): void {
    const message = err.error?.errors?.statut?.[0] ?? err.error?.errors?.mois?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
