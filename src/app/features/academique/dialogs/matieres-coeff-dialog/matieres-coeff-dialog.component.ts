import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ClasseAnnee, Matiere } from '../../../../core/models/academique.model';

export interface MatieresCoeffDialogData {
  classeAnnee: ClasseAnnee;
  matieresDisponibles: Matiere[];
}

@Component({
  selector: 'app-matieres-coeff-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './matieres-coeff-dialog.component.html',
  styleUrl: './matieres-coeff-dialog.component.scss',
})
export class MatieresCoeffDialogComponent {
  protected readonly data = inject<MatieresCoeffDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<MatieresCoeffDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly lignes = this.fb.array(
    this.data.classeAnnee.matieres.map((m) =>
      this.fb.nonNullable.group({
        matiere_id: [m.matiere_id as number | null, Validators.required],
        coefficient: [m.coefficient, [Validators.required, Validators.min(0.5), Validators.max(20)]],
      }),
    ),
  );

  ajouterLigne(): void {
    this.lignes.push(
      this.fb.nonNullable.group({
        matiere_id: [null as number | null, Validators.required],
        coefficient: [1, [Validators.required, Validators.min(0.5), Validators.max(20)]],
      }),
    );
  }

  supprimerLigne(index: number): void {
    this.lignes.removeAt(index);
  }

  submit(): void {
    if (this.lignes.invalid || this.lignes.length === 0) {
      this.lignes.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.lignes.getRawValue());
  }
}
