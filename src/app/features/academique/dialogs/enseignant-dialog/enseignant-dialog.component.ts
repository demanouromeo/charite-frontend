import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PersonnelService } from '../../../../core/services/personnel.service';
import { User } from '../../../../core/models/user.model';
import { ClasseAnnee } from '../../../../core/models/academique.model';

export interface EnseignantDialogData {
  classeAnnee: ClasseAnnee;
}

@Component({
  selector: 'app-enseignant-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatFormFieldModule, MatSelectModule, MatButtonModule],
  templateUrl: './enseignant-dialog.component.html',
})
export class EnseignantDialogComponent implements OnInit {
  protected readonly data = inject<EnseignantDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<EnseignantDialogComponent>);
  private readonly personnelService = inject(PersonnelService);

  protected readonly enseignants = signal<User[]>([]);
  protected readonly enseignantId = signal<number | null>(this.data.classeAnnee.enseignant_principal?.id ?? null);

  ngOnInit(): void {
    this.personnelService.list({ role: 'enseignant', statut: 'actif' }).subscribe((res) => this.enseignants.set(res.data));
  }

  submit(): void {
    if (!this.enseignantId()) return;
    this.dialogRef.close(this.enseignantId());
  }
}
