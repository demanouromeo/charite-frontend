import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoteService } from '../../../core/services/note.service';
import { Eleve } from '../../../core/models/eleve.model';
import { PeriodeType, Trimestre } from '../../../core/models/note.model';
import { telechargerBlob } from '../../../shared/telecharger-blob';

export interface EleveBulletinsDialogData {
  eleve: Eleve;
  anneeScolaireId: number;
  anneeLibelle: string;
}

@Component({
  selector: 'app-eleve-bulletins-dialog',
  standalone: true,
  imports: [FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './eleve-bulletins-dialog.component.html',
  styleUrl: './eleve-bulletins-dialog.component.scss',
})
export class EleveBulletinsDialogComponent implements OnInit {
  protected readonly data = inject<EleveBulletinsDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<EleveBulletinsDialogComponent>);
  private readonly noteService = inject(NoteService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly trimestres = signal<Trimestre[]>([]);
  protected readonly type = signal<PeriodeType>('sequence');
  protected readonly sequenceId = signal<number | null>(null);
  protected readonly trimestreId = signal<number | null>(null);
  protected readonly telechargement = signal(false);

  protected readonly sequences = computed(() =>
    this.trimestres().flatMap((t) => t.sequences.map((s) => ({ id: s.id, label: `${t.libelle} — ${s.libelle}` }))),
  );

  protected readonly peutTelecharger = computed(() => {
    if (this.type() === 'sequence') return this.sequenceId() !== null;
    if (this.type() === 'trimestre') return this.trimestreId() !== null;
    return true;
  });

  ngOnInit(): void {
    this.noteService.trimestres(this.data.anneeScolaireId).subscribe((res) => this.trimestres.set(res.data));
  }

  onTypeChange(): void {
    this.sequenceId.set(null);
    this.trimestreId.set(null);
  }

  telecharger(): void {
    const eleveId = this.data.eleve.id;
    this.telechargement.set(true);

    const observable =
      this.type() === 'sequence'
        ? this.noteService.bulletinSequentielPdf(eleveId, this.sequenceId()!)
        : this.type() === 'trimestre'
          ? this.noteService.bulletinTrimestrielPdf(eleveId, this.trimestreId()!)
          : this.noteService.bulletinAnnuelPdf(eleveId, this.data.anneeScolaireId);

    observable.subscribe({
      next: (blob) => {
        telechargerBlob(blob, `bulletin-${this.data.eleve.matricule}.pdf`);
        this.telechargement.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Impossible de générer le bulletin.', 'Fermer', { duration: 4000 });
        this.telechargement.set(false);
      },
    });
  }
}
