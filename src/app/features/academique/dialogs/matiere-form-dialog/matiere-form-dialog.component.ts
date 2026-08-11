import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Matiere, Section } from '../../../../core/models/academique.model';

export interface MatiereFormDialogData {
  mode: 'create' | 'edit';
  matiere?: Matiere;
  sections: Section[];
}

@Component({
  selector: 'app-matiere-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './matiere-form-dialog.component.html',
})
export class MatiereFormDialogComponent {
  protected readonly data = inject<MatiereFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<MatiereFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly isEdit = this.data.mode === 'edit';

  protected readonly form = this.fb.nonNullable.group({
    section_id: [this.data.matiere?.section?.id ?? null],
    nom: [this.data.matiere?.nom ?? '', Validators.required],
    code: [this.data.matiere?.code ?? '', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
