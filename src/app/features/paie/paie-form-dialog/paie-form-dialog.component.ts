import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Salaire } from '../../../core/models/salaire.model';
import { User } from '../../../core/models/user.model';

export interface PaieFormDialogData {
  mode: 'create' | 'edit';
  personnel: User[];
  salaire?: Salaire;
}

const MOIS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

@Component({
  selector: 'app-paie-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './paie-form-dialog.component.html',
  styleUrl: './paie-form-dialog.component.scss',
})
export class PaieFormDialogComponent {
  protected readonly data = inject<PaieFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<PaieFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly moisOptions = MOIS_OPTIONS;
  protected readonly isEdit = this.data.mode === 'edit';
  protected readonly personnel = this.data.personnel;

  private readonly maintenant = new Date();

  protected readonly form = this.fb.nonNullable.group({
    user_id: [this.data.salaire?.user_id ?? (null as number | null), Validators.required],
    mois: [this.data.salaire?.mois ?? this.maintenant.getMonth() + 1, Validators.required],
    annee: [this.data.salaire?.annee ?? this.maintenant.getFullYear(), [Validators.required, Validators.min(2000)]],
    salaire_base: [this.data.salaire?.salaire_base ?? 0, [Validators.required, Validators.min(0)]],
    primes: [this.data.salaire?.primes ?? 0, [Validators.required, Validators.min(0)]],
    retenues: [this.data.salaire?.retenues ?? 0, [Validators.required, Validators.min(0)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }
}
