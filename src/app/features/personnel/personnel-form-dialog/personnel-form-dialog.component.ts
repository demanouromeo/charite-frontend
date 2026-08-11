import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Role, User } from '../../../core/models/user.model';

export interface PersonnelFormDialogData {
  mode: 'create' | 'edit';
  user?: User;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'administrateur', label: 'Administrateur' },
  { value: 'econome', label: 'Économe' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'enseignant', label: 'Enseignant' },
];

@Component({
  selector: 'app-personnel-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './personnel-form-dialog.component.html',
  styleUrl: './personnel-form-dialog.component.scss',
})
export class PersonnelFormDialogComponent {
  protected readonly data = inject<PersonnelFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<PersonnelFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly roleOptions = ROLE_OPTIONS;
  protected readonly isEdit = this.data.mode === 'edit';

  protected readonly form = this.fb.nonNullable.group({
    nom: [this.data.user?.nom ?? '', Validators.required],
    prenom: [this.data.user?.prenom ?? '', Validators.required],
    email: [this.data.user?.email ?? '', [Validators.required, Validators.email]],
    telephone: [this.data.user?.telephone ?? ''],
    sexe: [this.data.user?.sexe ?? ''],
    anciennete_date: [this.data.user?.anciennete_date ?? ''],
    role: [this.data.user?.roles?.[0] ?? ('enseignant' as Role), Validators.required],
    password: ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close(this.form.getRawValue());
  }
}
