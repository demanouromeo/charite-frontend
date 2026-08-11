import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AcademiqueService } from '../../core/services/academique.service';
import { NoteService } from '../../core/services/note.service';
import { AnneeScolaire } from '../../core/models/academique.model';
import { PeriodeType, StatistiquesDashboard, Trimestre } from '../../core/models/note.model';

interface PeriodeOption {
  type: PeriodeType;
  id: number;
  label: string;
}

@Component({
  selector: 'app-statistiques',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatTableModule],
  templateUrl: './statistiques.component.html',
  styleUrl: './statistiques.component.scss',
})
export class StatistiquesComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly noteService = inject(NoteService);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly trimestres = signal<Trimestre[]>([]);
  protected readonly periodeSelectionnee = signal<string | null>(null);
  protected readonly dashboard = signal<StatistiquesDashboard | null>(null);
  protected readonly loading = signal(false);

  protected readonly displayedColumnsClasse = ['nom', 'effectif', 'effectif_note', 'moyenne_classe', 'taux_reussite'];
  protected readonly displayedColumnsMatiere = ['matiere', 'moyenne', 'nombre_notes'];

  protected readonly periodesDisponibles = computed<PeriodeOption[]>(() => {
    const options: PeriodeOption[] = [];
    for (const t of this.trimestres()) {
      for (const s of t.sequences) {
        options.push({ type: 'sequence', id: s.id, label: `${t.libelle} — ${s.libelle}` });
      }
      options.push({ type: 'trimestre', id: t.id, label: `${t.libelle} (ensemble)` });
    }
    const anneeId = this.anneeSelectionneeId();
    if (anneeId) options.push({ type: 'annuel', id: anneeId, label: 'Année complète' });
    return options;
  });

  ngOnInit(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      const active = res.data.find((a) => a.is_active) ?? res.data[0];
      if (active) {
        this.anneeSelectionneeId.set(active.id);
        this.chargerTrimestres(active.id);
      }
    });
  }

  onAnneeChange(anneeId: number | null): void {
    this.anneeSelectionneeId.set(anneeId);
    this.periodeSelectionnee.set(null);
    this.trimestres.set([]);
    this.dashboard.set(null);
    if (anneeId) this.chargerTrimestres(anneeId);
  }

  onPeriodeChange(): void {
    const anneeId = this.anneeSelectionneeId();
    const cle = this.periodeSelectionnee();
    if (!anneeId || !cle) {
      this.dashboard.set(null);
      return;
    }
    const [type, id] = cle.split(':');
    this.loading.set(true);
    this.noteService.statistiques(anneeId, type as PeriodeType, Number(id)).subscribe({
      next: (res) => {
        this.dashboard.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.dashboard.set(null);
      },
    });
  }

  cleOption(option: PeriodeOption): string {
    return `${option.type}:${option.id}`;
  }

  private chargerTrimestres(anneeId: number): void {
    this.noteService.trimestres(anneeId).subscribe((res) => this.trimestres.set(res.data));
  }
}
