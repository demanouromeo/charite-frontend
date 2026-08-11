import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AcademiqueService } from '../../core/services/academique.service';
import { EleveService } from '../../core/services/eleve.service';
import { NoteService } from '../../core/services/note.service';
import { AnneeScolaire, ClasseAnnee } from '../../core/models/academique.model';
import { Eleve } from '../../core/models/eleve.model';
import { Trimestre } from '../../core/models/note.model';
import { telechargerBlob } from '../../shared/telecharger-blob';

type TypeBulletin = 'trimestre' | 'annuel';

@Component({
  selector: 'app-bulletins',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './bulletins.component.html',
  styleUrl: './bulletins.component.scss',
})
export class BulletinsComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly eleveService = inject(EleveService);
  private readonly noteService = inject(NoteService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly annee = signal<AnneeScolaire | null>(null);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly classeAnneeId = signal<number | null>(null);
  protected readonly trimestres = signal<Trimestre[]>([]);
  protected readonly type = signal<TypeBulletin>('trimestre');
  protected readonly trimestreId = signal<number | null>(null);
  protected readonly eleves = signal<Eleve[]>([]);
  protected readonly selection = signal<Set<number>>(new Set());
  protected readonly chargementEleves = signal(false);
  protected readonly impressionTout = signal(false);
  protected readonly impressionSelection = signal(false);
  protected readonly impressionHonneur = signal(false);

  protected readonly displayedColumns = ['selection', 'matricule', 'nom_complet'];

  protected readonly peutImprimer = computed(() => this.type() === 'annuel' || this.trimestreId() !== null);
  protected readonly toutSelectionne = computed(
    () => this.eleves().length > 0 && this.selection().size === this.eleves().length,
  );
  protected readonly selectionPartielle = computed(
    () => this.selection().size > 0 && this.selection().size < this.eleves().length,
  );

  ngOnInit(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => {
      const active = res.data.find((a) => a.is_active) ?? res.data[0] ?? null;
      this.annee.set(active);
      if (active) {
        this.academiqueService.classesAnnee(active.id).subscribe((r) => this.classesAnnee.set(r.data));
        this.noteService.trimestres(active.id).subscribe((r) => this.trimestres.set(r.data));
      }
    });
  }

  onClasseChange(): void {
    this.selection.set(new Set());
    const classeAnneeId = this.classeAnneeId();
    if (!classeAnneeId) {
      this.eleves.set([]);
      return;
    }
    this.chargementEleves.set(true);
    this.eleveService.list({ classe_annee_id: classeAnneeId, statut: 'actif' }).subscribe({
      next: (res) => {
        this.eleves.set(res.data);
        this.chargementEleves.set(false);
      },
      error: () => this.chargementEleves.set(false),
    });
  }

  onTypeChange(): void {
    this.trimestreId.set(null);
  }

  toggleTous(evenement: MatCheckboxChange): void {
    this.selection.set(evenement.checked ? new Set(this.eleves().map((e) => e.id)) : new Set());
  }

  toggleUn(eleveId: number, evenement: MatCheckboxChange): void {
    const ensemble = new Set(this.selection());
    if (evenement.checked) ensemble.add(eleveId);
    else ensemble.delete(eleveId);
    this.selection.set(ensemble);
  }

  estSelectionne(eleveId: number): boolean {
    return this.selection().has(eleveId);
  }

  imprimerTout(): void {
    this.lancerImpression(this.impressionTout, undefined, 'classe entière');
  }

  imprimerSelection(): void {
    const ids = Array.from(this.selection());
    if (ids.length === 0) return;
    this.lancerImpression(this.impressionSelection, ids, 'sélection');
  }

  imprimerTableauHonneurGlobal(): void {
    const annee = this.annee();
    const periodeId = this.type() === 'annuel' ? annee?.id ?? null : this.trimestreId();
    if (!annee || !this.peutImprimer() || !periodeId) return;

    this.impressionHonneur.set(true);
    this.noteService.tableauHonneurGlobalPdf(annee.id, this.type(), periodeId).subscribe({
      next: (blob) => {
        telechargerBlob(blob, `tableau-honneur-${annee.libelle}-${this.type()}.pdf`);
        this.impressionHonneur.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? "Impossible de générer le tableau d'honneur.", 'Fermer', {
          duration: 4000,
        });
        this.impressionHonneur.set(false);
      },
    });
  }

  private lancerImpression(indicateur: WritableSignal<boolean>, eleveIds: number[] | undefined, libelle: string): void {
    const classeAnneeId = this.classeAnneeId();
    const anneeId = this.annee()?.id;
    if (!classeAnneeId || !anneeId) return;

    indicateur.set(true);
    const nomClasse = this.classesAnnee().find((c) => c.id === classeAnneeId)?.classe.nom ?? 'classe';

    const observable =
      this.type() === 'trimestre'
        ? this.noteService.bulletinsClasseTrimestrielPdf(classeAnneeId, this.trimestreId()!, eleveIds)
        : this.noteService.bulletinsClasseAnnuelPdf(classeAnneeId, anneeId, eleveIds);

    observable.subscribe({
      next: (blob) => {
        telechargerBlob(blob, `bulletins-${nomClasse}-${this.type()}.pdf`);
        indicateur.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? `Impossible de générer les bulletins (${libelle}).`, 'Fermer', {
          duration: 4000,
        });
        indicateur.set(false);
      },
    });
  }
}
