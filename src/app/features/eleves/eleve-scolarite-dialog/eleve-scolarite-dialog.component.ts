import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ScolariteService } from '../../../core/services/scolarite.service';
import { Eleve } from '../../../core/models/eleve.model';
import { Paiement, ScolariteEleve } from '../../../core/models/scolarite.model';
import { telechargerBlob } from '../../../shared/telecharger-blob';

export interface EleveScolariteDialogData {
  eleve: Eleve;
  anneeScolaireId: number;
  anneeLibelle: string;
}

@Component({
  selector: 'app-eleve-scolarite-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './eleve-scolarite-dialog.component.html',
  styleUrl: './eleve-scolarite-dialog.component.scss',
})
export class EleveScolariteDialogComponent implements OnInit {
  protected readonly data = inject<EleveScolariteDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<EleveScolariteDialogComponent>);
  private readonly scolariteService = inject(ScolariteService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);

  protected readonly chargement = signal(true);
  protected readonly enregistrement = signal(false);
  protected readonly impressionRecuId = signal<number | null>(null);
  protected readonly scolarite = signal<ScolariteEleve | null>(null);
  protected readonly displayedColumns = ['tranche', 'montant', 'date_paiement', 'recu_numero', 'actions'];

  protected readonly tranchesPayees = computed(() => new Set(this.scolarite()?.paiements.map((p) => p.tranche) ?? []));
  protected readonly tranchesDisponibles = computed(() =>
    ([1, 2, 3] as const).filter((t) => !this.tranchesPayees().has(t)),
  );

  protected readonly form = this.fb.nonNullable.group({
    tranche: [null as 1 | 2 | 3 | null, Validators.required],
    montant: [0, [Validators.required, Validators.min(0.01)]],
    date_paiement: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);
    this.scolariteService.scolariteEleve(this.data.eleve.id, this.data.anneeScolaireId).subscribe({
      next: (res) => {
        this.scolarite.set(res.data);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  onTrancheChange(tranche: 1 | 2 | 3): void {
    const bareme = this.scolarite()?.bareme;
    if (!bareme) return;
    const montant = { 1: bareme.montant_tranche1, 2: bareme.montant_tranche2, 3: bareme.montant_tranche3 }[tranche];
    this.form.patchValue({ montant });
  }

  enregistrerPaiement(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valeur = this.form.getRawValue();
    this.enregistrement.set(true);
    this.scolariteService
      .enregistrerPaiement(this.data.eleve.id, {
        annee_scolaire_id: this.data.anneeScolaireId,
        tranche: valeur.tranche!,
        montant: valeur.montant,
        date_paiement: valeur.date_paiement,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Paiement enregistré.', 'Fermer', { duration: 3000 });
          this.form.reset({ tranche: null, montant: 0, date_paiement: new Date().toISOString().slice(0, 10) });
          this.enregistrement.set(false);
          this.charger();
        },
        error: (err) => {
          this.afficherErreur(err);
          this.enregistrement.set(false);
        },
      });
  }

  imprimerRecu(paiement: Paiement): void {
    this.impressionRecuId.set(paiement.id);
    this.scolariteService.recuPdf(this.data.eleve.id, paiement.id).subscribe({
      next: (blob) => {
        telechargerBlob(blob, `recu-${paiement.recu_numero}.pdf`);
        this.impressionRecuId.set(null);
      },
      error: (err) => {
        this.afficherErreur(err);
        this.impressionRecuId.set(null);
      },
    });
  }

  private afficherErreur(err: any): void {
    const message = err.error?.errors?.tranche?.[0] ?? err.error?.errors?.montant?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
