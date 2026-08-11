import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { PersonnelService } from '../../core/services/personnel.service';
import { PointageService } from '../../core/services/pointage.service';
import { Pointage } from '../../core/models/pointage.model';
import { User } from '../../core/models/user.model';

const MOIS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

@Component({
  selector: 'app-pointage',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './pointage.component.html',
  styleUrl: './pointage.component.scss',
})
export class PointageComponent implements OnInit {
  private readonly pointageService = inject(PointageService);
  private readonly personnelService = inject(PersonnelService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly mois = MOIS;
  protected readonly vueGestion = computed(() => this.authService.hasRole('administrateur', 'secretaire'));

  protected readonly enseignants = signal<User[]>([]);
  protected readonly pointages = signal<Pointage[]>([]);
  protected readonly loading = signal(false);
  protected readonly enregistrement = signal(false);

  protected readonly enseignantSelectionneId = signal<number | null>(null);
  protected readonly dateSelectionnee = signal<string>(this.aujourdhui());
  protected readonly heureArrivee = signal<string>('');
  protected readonly heureDepart = signal<string>('');

  protected readonly moisFiltre = signal<number>(new Date().getMonth() + 1);
  protected readonly anneeFiltre = signal<number>(new Date().getFullYear());

  protected readonly pointageAujourdhui = computed<Pointage | null>(() => {
    const uid = this.authService.currentUser()?.id;
    const today = this.aujourdhui();
    return this.pointages().find((p) => p.enseignant_id === uid && p.date === today) ?? null;
  });

  ngOnInit(): void {
    if (this.vueGestion()) {
      this.personnelService.list({ role: 'enseignant' }).subscribe((res) => this.enseignants.set(res.data));
    }
    this.charger();
  }

  charger(): void {
    this.loading.set(true);
    this.pointageService
      .liste({
        mois: this.moisFiltre(),
        annee: this.anneeFiltre(),
        enseignant_id: this.vueGestion() ? (this.enseignantSelectionneId() ?? undefined) : undefined,
      })
      .subscribe({
        next: (res) => {
          this.pointages.set(res.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  pointerMaintenant(type: 'arrivee' | 'depart'): void {
    const uid = this.authService.currentUser()?.id;
    if (!uid) return;

    const heure = this.heureActuelle();
    this.enregistrement.set(true);
    this.pointageService
      .enregistrer({
        enseignant_id: uid,
        date: this.aujourdhui(),
        ...(type === 'arrivee' ? { heure_arrivee: heure } : { heure_depart: heure }),
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Pointage enregistré.', 'Fermer', { duration: 3000 });
          this.enregistrement.set(false);
          this.charger();
        },
        error: (err) => {
          this.afficherErreur(err);
          this.enregistrement.set(false);
        },
      });
  }

  enregistrerGestion(): void {
    const enseignantId = this.enseignantSelectionneId();
    if (!enseignantId) return;

    this.enregistrement.set(true);
    this.pointageService
      .enregistrer({
        enseignant_id: enseignantId,
        date: this.dateSelectionnee(),
        heure_arrivee: this.heureArrivee() || undefined,
        heure_depart: this.heureDepart() || undefined,
      })
      .subscribe({
        next: () => {
          this.snackBar.open('Pointage enregistré.', 'Fermer', { duration: 3000 });
          this.enregistrement.set(false);
          this.heureArrivee.set('');
          this.heureDepart.set('');
          this.charger();
        },
        error: (err) => {
          this.afficherErreur(err);
          this.enregistrement.set(false);
        },
      });
  }

  private aujourdhui(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private heureActuelle(): string {
    return new Date().toTimeString().slice(0, 5);
  }

  private afficherErreur(err: any): void {
    const message =
      err.error?.errors?.date?.[0] ?? err.error?.errors?.heure_depart?.[0] ?? err.error?.message ?? 'Une erreur est survenue.';
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }
}
