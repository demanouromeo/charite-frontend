import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademiqueService } from '../../../core/services/academique.service';
import { AuthService } from '../../../core/services/auth.service';
import { NoteService } from '../../../core/services/note.service';
import { AnneeScolaire, ClasseAnnee } from '../../../core/models/academique.model';
import { GrilleNotes, Trimestre } from '../../../core/models/note.model';
import { telechargerBlob } from '../../../shared/telecharger-blob';

interface SequenceOption {
  id: number;
  label: string;
  verrouille: boolean;
}

interface RemplissageMatiere {
  classe_matiere_id: number;
  nom: string;
  rempli: number;
  total: number;
  taux: number;
}

@Component({
  selector: 'app-notes-saisie',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './notes-saisie.component.html',
  styleUrl: './notes-saisie.component.scss',
})
export class NotesSaisieComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly noteService = inject(NoteService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly authService = inject(AuthService);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly classeAnneeSelectionneeId = signal<number | null>(null);
  protected readonly trimestres = signal<Trimestre[]>([]);
  protected readonly sequenceSelectionneeId = signal<number | null>(null);
  protected readonly grille = signal<GrilleNotes | null>(null);
  protected readonly valeurs = signal<Map<string, number | null>>(new Map());
  protected readonly loading = signal(false);
  protected readonly chargementAnnees = signal(false);
  protected readonly chargementClasses = signal(false);
  protected readonly chargementSequences = signal(false);
  protected readonly enregistrement = signal(false);
  protected readonly telechargementHonneur = signal(false);
  protected readonly toolboxOuverte = signal(false);

  protected readonly peutVoirToutesLesClasses = computed(() => this.authService.hasRole('administrateur', 'secretaire'));
  protected readonly peutImprimerTableauHonneur = computed(() => this.authService.hasRole('administrateur', 'secretaire'));

  protected readonly classesDisponibles = computed(() => {
    const toutes = this.classesAnnee();
    if (this.peutVoirToutesLesClasses()) return toutes;
    const userId = this.authService.currentUser()?.id;
    return toutes.filter((c) => c.enseignant_principal?.id === userId);
  });

  protected readonly sequencesDisponibles = computed<SequenceOption[]>(() =>
    this.trimestres().flatMap((t) =>
      t.sequences.map((s) => ({ id: s.id, label: `${t.libelle} — ${s.libelle}`, verrouille: s.verrouille })),
    ),
  );

  protected readonly sequenceSelectionnee = computed(() =>
    this.sequencesDisponibles().find((s) => s.id === this.sequenceSelectionneeId()) ?? null,
  );

  protected readonly peutForcerSaisieBloquee = computed(
    () =>
      this.authService.hasRole('administrateur') ||
      (this.authService.currentUser()?.permissions ?? []).includes('notes.saisir_sequence_bloquee'),
  );

  protected readonly peutSaisir = computed(() => {
    const sequence = this.sequenceSelectionnee();
    if (!sequence) return false;
    return !sequence.verrouille || this.peutForcerSaisieBloquee();
  });

  protected readonly remplissageParMatiere = computed<RemplissageMatiere[]>(() => {
    const g = this.grille();
    if (!g) return [];
    const valeurs = this.valeurs();
    const total = g.eleves.length;
    return g.matieres.map((matiere) => {
      const rempli = g.eleves.filter((eleve) => valeurs.get(this.cle(eleve.id, matiere.classe_matiere_id)) != null).length;
      return {
        classe_matiere_id: matiere.classe_matiere_id,
        nom: matiere.nom,
        rempli,
        total,
        taux: total === 0 ? 0 : Math.round((rempli / total) * 100),
      };
    });
  });

  protected readonly remplissageGlobal = computed(() => {
    const details = this.remplissageParMatiere();
    const rempli = details.reduce((somme, d) => somme + d.rempli, 0);
    const total = details.reduce((somme, d) => somme + d.total, 0);
    return { rempli, total, taux: total === 0 ? 0 : Math.round((rempli / total) * 100) };
  });

  ngOnInit(): void {
    this.chargementAnnees.set(true);
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      this.chargementAnnees.set(false);
      const active = res.data.find((a) => a.is_active) ?? res.data[0];
      if (active) {
        this.anneeSelectionneeId.set(active.id);
        this.chargerClasses(active.id);
        this.chargerTrimestres(active.id);
      }
    });
  }

  onAnneeChange(anneeId: number | null): void {
    this.anneeSelectionneeId.set(anneeId);
    this.classeAnneeSelectionneeId.set(null);
    this.sequenceSelectionneeId.set(null);
    this.classesAnnee.set([]);
    this.trimestres.set([]);
    this.grille.set(null);
    if (anneeId) {
      this.chargerClasses(anneeId);
      this.chargerTrimestres(anneeId);
    }
  }

  onSelectionChange(): void {
    const classeAnneeId = this.classeAnneeSelectionneeId();
    const sequenceId = this.sequenceSelectionneeId();
    if (classeAnneeId && sequenceId) {
      this.chargerGrille(classeAnneeId, sequenceId);
    } else {
      this.grille.set(null);
    }
  }

  basculerToolbox(): void {
    this.toolboxOuverte.set(!this.toolboxOuverte());
  }

  obtenirValeur(eleveId: number, classeMatiereId: number): number | null {
    return this.valeurs().get(this.cle(eleveId, classeMatiereId)) ?? null;
  }

  definirValeur(eleveId: number, classeMatiereId: number, event: Event): void {
    const brut = (event.target as HTMLInputElement).value;
    const valeur = brut === '' ? null : Number(brut);
    const copie = new Map(this.valeurs());
    copie.set(this.cle(eleveId, classeMatiereId), valeur);
    this.valeurs.set(copie);
  }

  enregistrer(): void {
    const g = this.grille();
    const classeAnneeId = this.classeAnneeSelectionneeId();
    const sequenceId = this.sequenceSelectionneeId();
    if (!g || !classeAnneeId || !sequenceId) return;

    const notes = g.eleves.flatMap((eleve) =>
      g.matieres
        .map((matiere) => ({ eleve, matiere, valeur: this.obtenirValeur(eleve.id, matiere.classe_matiere_id) }))
        .filter((n) => n.valeur !== null)
        .map((n) => ({ eleve_id: n.eleve.id, classe_matiere_id: n.matiere.classe_matiere_id, note: n.valeur as number })),
    );

    if (notes.length === 0) {
      this.snackBar.open('Aucune note saisie.', 'Fermer', { duration: 3000 });
      return;
    }

    this.enregistrement.set(true);
    this.noteService.enregistrer(classeAnneeId, sequenceId, notes).subscribe({
      next: () => {
        this.snackBar.open('Notes enregistrées.', 'Fermer', { duration: 3000 });
        this.enregistrement.set(false);
        this.chargerGrille(classeAnneeId, sequenceId);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Une erreur est survenue.', 'Fermer', { duration: 4000 });
        this.enregistrement.set(false);
      },
    });
  }

  imprimerTableauHonneur(): void {
    const classeAnneeId = this.classeAnneeSelectionneeId();
    const sequenceId = this.sequenceSelectionneeId();
    if (!classeAnneeId || !sequenceId) return;

    this.telechargementHonneur.set(true);
    this.noteService.tableauHonneurPdf(classeAnneeId, 'sequence', sequenceId).subscribe({
      next: (blob) => {
        telechargerBlob(blob, 'tableau-honneur.pdf');
        this.telechargementHonneur.set(false);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Impossible de générer le tableau d\'honneur.', 'Fermer', { duration: 4000 });
        this.telechargementHonneur.set(false);
      },
    });
  }

  private chargerClasses(anneeId: number): void {
    this.chargementClasses.set(true);
    this.academiqueService.classesAnnee(anneeId).subscribe((res) => {
      this.classesAnnee.set(res.data);
      this.chargementClasses.set(false);
    });
  }

  private chargerTrimestres(anneeId: number): void {
    this.chargementSequences.set(true);
    this.noteService.trimestres(anneeId).subscribe((res) => {
      this.trimestres.set(res.data);
      this.chargementSequences.set(false);
    });
  }

  private chargerGrille(classeAnneeId: number, sequenceId: number): void {
    this.loading.set(true);
    this.noteService.grille(classeAnneeId, sequenceId).subscribe({
      next: (res) => {
        this.grille.set(res.data);
        const carte = new Map<string, number | null>();
        for (const n of res.data.notes) {
          carte.set(this.cle(n.eleve_id, n.classe_matiere_id), n.note);
        }
        this.valeurs.set(carte);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message ?? 'Impossible de charger la grille.', 'Fermer', { duration: 4000 });
      },
    });
  }

  private cle(eleveId: number, classeMatiereId: number): string {
    return `${eleveId}:${classeMatiereId}`;
  }
}
