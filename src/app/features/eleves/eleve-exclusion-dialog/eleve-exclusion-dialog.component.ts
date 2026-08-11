import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Eleve } from '../../../core/models/eleve.model';

export interface EleveExclusionDialogData {
  eleve: Eleve;
}

@Component({
  selector: 'app-eleve-exclusion-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './eleve-exclusion-dialog.component.html',
})
export class EleveExclusionDialogComponent {
  protected readonly data = inject<EleveExclusionDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<EleveExclusionDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    motif: ['', Validators.required],
    date_exclusion: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
