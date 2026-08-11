import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Classe, Section } from '../../../../core/models/academique.model';

export interface ClasseFormDialogData {
  mode: 'create' | 'edit';
  classe?: Classe;
  sections: Section[];
}

@Component({
  selector: 'app-classe-form-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule],
  templateUrl: './classe-form-dialog.component.html',
})
export class ClasseFormDialogComponent {
  protected readonly data = inject<ClasseFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<ClasseFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly isEdit = this.data.mode === 'edit';

  protected readonly form = this.fb.nonNullable.group({
    section_id: [this.data.classe?.section.id ?? null, Validators.required],
    nom: [this.data.classe?.nom ?? '', Validators.required],
    niveau: [this.data.classe?.niveau ?? 1, [Validators.required, Validators.min(1), Validators.max(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.form.getRawValue());
  }
}
