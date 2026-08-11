import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AcademiqueService } from '../../core/services/academique.service';
import { AuthService } from '../../core/services/auth.service';
import { DisciplineService } from '../../core/services/discipline.service';
import { EleveService } from '../../core/services/eleve.service';
import { AnneeScolaire, ClasseAnnee } from '../../core/models/academique.model';
import { CommentaireDiscipline } from '../../core/models/discipline.model';
import { Eleve } from '../../core/models/eleve.model';

@Component({
  selector: 'app-discipline',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './discipline.component.html',
  styleUrl: './discipline.component.scss',
})
export class DisciplineComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly eleveService = inject(EleveService);
  private readonly disciplineService = inject(DisciplineService);
  protected readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly classeAnneeSelectionneeId = signal<number | null>(null);
  protected readonly eleves = signal<Eleve[]>([]);
  protected readonly eleveSelectionneId = signal<number | null>(null);

  protected readonly commentaires = signal<CommentaireDiscipline[]>([]);
  protected readonly loading = signal(false);
  protected readonly enregistrement = signal(false);
  protected readonly commentaireEnEditionId = signal<number | null>(null);
  protected readonly contenuEdition = signal('');

  protected readonly nouveauContenu = signal('');
  protected readonly nouvelleDate = signal<string>(new Date().toISOString().slice(0, 10));

  protected readonly peutVoirToutesLesClasses = computed(() => this.authService.hasRole('administrateur', 'secretaire'));
  protected readonly classesDisponibles = computed(() => {
    const toutes = this.classesAnnee();
    if (this.peutVoirToutesLesClasses()) return toutes;
    const userId = this.authService.currentUser()?.id;
    return toutes.filter((c) => c.enseignant_principal?.id === userId);
  });

  ngOnInit(): void {
    this.academiqueService.anneesScolaires().subscribe((res) => {
      this.annees.set(res.data);
      const active = res.data.find((a) => a.is_active) ?? res.data[0];
      if (active) {
        this.anneeSelectionneeId.set(active.id);
        this.chargerClasses(active.id);
      }
    });
  }

  onAnneeChange(anneeId: number | null): void {
    this.anneeSelectionneeId.set(anneeId);
    this.classeAnneeSelectionneeId.set(null);
    this.eleveSelectionneId.set(null);
    this.classesAnnee.set([]);
    this.eleves.set([]);
    this.commentaires.set([]);
    if (anneeId) this.chargerClasses(anneeId);
  }

  onClasseChange(): void {
    const classeAnneeId = this.classeAnneeSelectionneeId();
    this.eleveSelectionneId.set(null);
    this.eleves.set([]);
    this.commentaires.set([]);
    if (classeAnneeId) {
      this.eleveService.list({ classe_annee_id: classeAnneeId, statut: 'actif' }).subscribe((res) => this.eleves.set(res.data));
    }
  }

  onEleveChange(): void {
    const eleveId = this.eleveSelectionneId();
    if (eleveId) {
      this.charger(eleveId);
    } else {
      this.commentaires.set([]);
    }
  }

  ajouter(): void {
    const eleveId = this.eleveSelectionneId();
    if (!eleveId || !this.nouveauContenu().trim()) return;

    this.enregistrement.set(true);
    this.disciplineService.ajouter({ eleve_id: eleveId, contenu: this.nouveauContenu().trim(), date: this.nouvelleDate() }).subscribe({
      next: () => {
        this.snackBar.open('Commentaire ajouté.', 'Fermer', { duration: 3000 });
        this.nouveauContenu.set('');
        this.enregistrement.set(false);
        this.charger(eleveId);
      },
      error: (err) => {
        this.afficherErreur(err);
        this.enregistrement.set(false);
      },
    });
  }

  commencerEdition(commentaire: CommentaireDiscipline): void {
    this.commentaireEnEditionId.set(commentaire.id);
    this.contenuEdition.set(commentaire.contenu);
  }

  annulerEdition(): void {
    this.commentaireEnEditionId.set(null);
    this.contenuEdition.set('');
  }

  enregistrerEdition(): void {
    const id = this.commentaireEnEditionId();
    const eleveId = this.eleveSelectionneId();
    if (!id || !eleveId || !this.contenuEdition().trim()) return;

    this.disciplineService.modifier(id, this.contenuEdition().trim()).subscribe({
      next: () => {
        this.snackBar.open('Commentaire modifié.', 'Fermer', { duration: 3000 });
        this.annulerEdition();
        this.charger(eleveId);
      },
      error: (err) => this.afficherErreur(err),
    });
  }

  peutModifier(commentaire: CommentaireDiscipline): boolean {
    return commentaire.modifiable || this.authService.hasRole('administrateur');
  }

  private charger(eleveId: number): void {
    this.loading.set(true);
    this.disciplineService.liste(eleveId).subscribe({
      next: (res) => {
        this.commentaires.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private chargerClasses(anneeId: number): void {
    this.academiqueService.classesAnnee(anneeId).subscribe((res) => this.classesAnnee.set(res.data));
  }

  private afficherErreur(err: any): void {
    const message = err.error?.errors?.date?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
