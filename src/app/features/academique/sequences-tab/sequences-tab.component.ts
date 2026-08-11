import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { NoteService } from '../../../core/services/note.service';
import { AnneeScolaire } from '../../../core/models/academique.model';
import { Sequence, Trimestre } from '../../../core/models/note.model';

@Component({
  selector: 'app-sequences-tab',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatSelectModule, MatTooltipModule],
  templateUrl: './sequences-tab.component.html',
  styleUrl: './sequences-tab.component.scss',
})
export class SequencesTabComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly noteService = inject(NoteService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly trimestres = signal<Trimestre[]>([]);
  protected readonly loading = signal(false);

  protected readonly peutGerer = computed(() => this.authService.hasRole('administrateur'));

  ngOnInit(): void {
    this.rafraichirAnnees();
  }

  rafraichirAnnees(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      const selectionEncoreValide = res.data.some((a) => a.id === this.anneeSelectionneeId());
      const cible = selectionEncoreValide
        ? this.anneeSelectionneeId()
        : (res.data.find((a) => a.is_active) ?? res.data[0])?.id ?? null;

      this.anneeSelectionneeId.set(cible);
      if (cible) this.charger();
    });
  }

  charger(): void {
    const anneeId = this.anneeSelectionneeId();
    if (!anneeId) return;
    this.loading.set(true);
    this.noteService.trimestres(anneeId).subscribe({
      next: (res) => {
        this.trimestres.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  basculerVerrou(sequence: Sequence): void {
    const action = sequence.verrouille ? this.noteService.deverrouiller(sequence.id) : this.noteService.verrouiller(sequence.id);
    action.subscribe({
      next: () => {
        this.snackBar.open(sequence.verrouille ? 'Séquence déverrouillée.' : 'Séquence verrouillée.', 'Fermer', { duration: 3000 });
        this.charger();
      },
      error: (err) => this.snackBar.open(err.error?.message ?? 'Une erreur est survenue.', 'Fermer', { duration: 4000 }),
    });
  }
}
