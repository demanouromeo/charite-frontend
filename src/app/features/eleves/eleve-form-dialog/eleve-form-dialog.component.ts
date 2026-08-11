import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AnneeScolaire, ClasseAnnee } from '../../../core/models/academique.model';
import { Eleve, SexeEleve } from '../../../core/models/eleve.model';

export interface EleveFormDialogData {
  mode: 'create' | 'edit';
  eleve?: Eleve;
}

@Component({
  selector: 'app-eleve-form-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './eleve-form-dialog.component.html',
  styleUrl: './eleve-form-dialog.component.scss',
})
export class EleveFormDialogComponent implements OnInit {
  protected readonly data = inject<EleveFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<EleveFormDialogComponent>);
  private readonly academiqueService = inject(AcademiqueService);
  private readonly fb = inject(FormBuilder);

  protected readonly isEdit = this.data.mode === 'edit';
  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly chargementAnnees = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    nom: [this.data.eleve?.nom ?? '', Validators.required],
    prenom: [this.data.eleve?.prenom ?? '', Validators.required],
    sexe: [this.data.eleve?.sexe ?? ('M' as SexeEleve), Validators.required],
    date_naissance: [this.data.eleve?.date_naissance ?? ''],
    nom_pere: [this.data.eleve?.nom_pere ?? ''],
    nom_mere: [this.data.eleve?.nom_mere ?? ''],
    contact_tuteur: [this.data.eleve?.contact_tuteur ?? ''],
    adresse: [this.data.eleve?.adresse ?? ''],
    classe_annee_id: [null as number | null, this.isEdit ? [] : [Validators.required]],
    date_inscription: [new Date().toISOString().slice(0, 10), this.isEdit ? [] : [Validators.required]],
    frais_inscription_du: [0 as number, this.isEdit ? [] : [Validators.required, Validators.min(0)]],
    frais_inscription_paye: [0 as number, [Validators.min(0)]],
  });

  ngOnInit(): void {
    if (this.isEdit) return;

    this.chargementAnnees.set(true);
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      this.chargementAnnees.set(false);
      const active = res.data.find((a) => a.is_active) ?? res.data[0];
      if (active) {
        this.anneeSelectionneeId.set(active.id);
        this.chargerClasses(active.id);
      }
    });
  }

  onAnneeChange(anneeId: number): void {
    this.anneeSelectionneeId.set(anneeId);
    this.form.patchValue({ classe_annee_id: null });
    this.chargerClasses(anneeId);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valeur = this.form.getRawValue();

    if (this.isEdit) {
      const { classe_annee_id, date_inscription, frais_inscription_du, frais_inscription_paye, ...payload } = valeur;
      this.dialogRef.close(payload);
      return;
    }

    this.dialogRef.close(valeur);
  }

  private chargerClasses(anneeId: number): void {
    this.academiqueService.classesAnnee(anneeId).subscribe((res) => this.classesAnnee.set(res.data));
  }
}
