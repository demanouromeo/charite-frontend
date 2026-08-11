import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Classe } from '../../../../core/models/academique.model';
import { FraisScolarite } from '../../../../core/models/scolarite.model';

export interface BaremeFormDialogData {
  mode: 'create' | 'edit';
  classe: Classe;
  bareme?: FraisScolarite;
}

@Component({
  selector: 'app-bareme-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './bareme-form-dialog.component.html',
})
export class BaremeFormDialogComponent {
  protected readonly data = inject<BaremeFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<BaremeFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly isEdit = this.data.mode === 'edit';

  protected readonly form = this.fb.nonNullable.group({
    montant_total: [this.data.bareme?.montant_total ?? 0, [Validators.required, Validators.min(0)]],
    montant_tranche1: [this.data.bareme?.montant_tranche1 ?? 0, [Validators.required, Validators.min(0)]],
    montant_tranche2: [this.data.bareme?.montant_tranche2 ?? 0, [Validators.min(0)]],
    montant_tranche3: [this.data.bareme?.montant_tranche3 ?? 0, [Validators.min(0)]],
  });

  protected get sommeTranches(): number {
    const v = this.form.getRawValue();
    return Number(v.montant_tranche1 || 0) + Number(v.montant_tranche2 || 0) + Number(v.montant_tranche3 || 0);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
