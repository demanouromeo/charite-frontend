import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, forkJoin, of } from 'rxjs';
import { AcademiqueService } from '../../core/services/academique.service';
import { AuthService } from '../../core/services/auth.service';
import { AbsenceService } from '../../core/services/absence.service';
import { EleveService } from '../../core/services/eleve.service';
import { AnneeScolaire, ClasseAnnee } from '../../core/models/academique.model';
import { Absence } from '../../core/models/absence.model';
import { Eleve } from '../../core/models/eleve.model';

interface LigneAbsence {
  eleve: Eleve;
  absent: boolean;
  justifiee: boolean;
  motif: string;
}

@Component({
  selector: 'app-absences',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
  ],
  templateUrl: './absences.component.html',
  styleUrl: './absences.component.scss',
})
export class AbsencesComponent implements OnInit {
  private readonly academiqueService = inject(AcademiqueService);
  private readonly eleveService = inject(EleveService);
  private readonly absenceService = inject(AbsenceService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly annees = signal<AnneeScolaire[]>([]);
  protected readonly anneeSelectionneeId = signal<number | null>(null);
  protected readonly classesAnnee = signal<ClasseAnnee[]>([]);
  protected readonly classeAnneeSelectionneeId = signal<number | null>(null);
  protected readonly dateSelectionnee = signal<string>(new Date().toISOString().slice(0, 10));

  protected readonly lignes = signal<LigneAbsence[]>([]);
  private absencesExistantes = new Map<number, Absence>();

  protected readonly loading = signal(false);
  protected readonly enregistrement = signal(false);

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
    this.classesAnnee.set([]);
    this.lignes.set([]);
    if (anneeId) this.chargerClasses(anneeId);
  }

  onSelectionChange(): void {
    const classeAnneeId = this.classeAnneeSelectionneeId();
    if (classeAnneeId && this.dateSelectionnee()) {
      this.chargerGrille(classeAnneeId, this.dateSelectionnee());
    } else {
      this.lignes.set([]);
    }
  }

  basculerAbsent(ligne: LigneAbsence): void {
    ligne.absent = !ligne.absent;
    this.lignes.set([...this.lignes()]);
  }

  enregistrer(): void {
    const classeAnneeId = this.classeAnneeSelectionneeId();
    const date = this.dateSelectionnee();
    if (!classeAnneeId || !date) return;

    const requetes: Observable<unknown>[] = this.lignes().map((ligne) => {
      const existante = this.absencesExistantes.get(ligne.eleve.id);

      if (ligne.absent) {
        return this.absenceService.marquer({
          eleve_id: ligne.eleve.id,
          classe_annee_id: classeAnneeId,
          date,
          justifiee: ligne.justifiee,
          motif: ligne.motif || undefined,
        });
      }

      if (existante) {
        return this.absenceService.supprimer(existante.id);
      }

      return of(null);
    });

    this.enregistrement.set(true);
    forkJoin(requetes).subscribe({
      next: () => {
        this.snackBar.open('Absences enregistrées.', 'Fermer', { duration: 3000 });
        this.enregistrement.set(false);
        this.chargerGrille(classeAnneeId, date);
      },
      error: (err) => {
        this.snackBar.open(err.error?.message ?? 'Une erreur est survenue.', 'Fermer', { duration: 4000 });
        this.enregistrement.set(false);
      },
    });
  }

  private chargerClasses(anneeId: number): void {
    this.academiqueService.classesAnnee(anneeId).subscribe((res) => this.classesAnnee.set(res.data));
  }

  private chargerGrille(classeAnneeId: number, date: string): void {
    this.loading.set(true);
    forkJoin({
      eleves: this.eleveService.list({ classe_annee_id: classeAnneeId, statut: 'actif' }),
      absences: this.absenceService.liste({ classe_annee_id: classeAnneeId, date }),
    }).subscribe({
      next: ({ eleves, absences }) => {
        this.absencesExistantes = new Map(absences.data.map((a) => [a.eleve_id, a]));

        this.lignes.set(
          eleves.data.map((eleve) => {
            const absence = this.absencesExistantes.get(eleve.id);
            return {
              eleve,
              absent: !!absence,
              justifiee: absence?.justifiee ?? false,
              motif: absence?.motif ?? '',
            };
          }),
        );
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
