import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { AuthService } from '../../core/services/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResume } from '../../core/models/dashboard.model';

const ROLE_LABELS: Record<string, string> = {
  administrateur: 'Administrateur',
  econome: 'Économe',
  secretaire: 'Secrétaire',
  enseignant: 'Enseignant',
};

const COULEURS = ['#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#e53935', '#00897b'];

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatCardModule, MatIconModule, MatProgressSpinnerModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  protected readonly authService = inject(AuthService);

  protected readonly loading = signal(true);
  protected readonly resume = signal<DashboardResume | null>(null);

  protected readonly aucuneAnneeActive = computed(() => !this.loading() && !this.resume()?.annee_scolaire);

  // Élèves — pie chart garçons / filles
  protected readonly elevesChartData = computed<ChartData<'pie'>>(() => {
    const eleves = this.resume()?.eleves;
    return {
      labels: ['Garçons', 'Filles'],
      datasets: [{ data: [eleves?.garcons ?? 0, eleves?.filles ?? 0], backgroundColor: ['#1e88e5', '#e91e8f'] }],
    };
  });
  protected readonly pieOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  // Classes — bar chart effectif vs capacité max
  protected readonly classesChartData = computed<ChartData<'bar'>>(() => {
    const classes = this.resume()?.classes?.par_classe ?? [];
    return {
      labels: classes.map((c) => c.nom),
      datasets: [
        { data: classes.map((c) => c.effectif), label: 'Effectif', backgroundColor: '#1e88e5' },
        { data: classes.map((c) => c.effectif_max ?? 0), label: 'Capacité max', backgroundColor: '#cfd8dc' },
      ],
    };
  });
  protected readonly barOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: 'bottom' } },
  };

  // Personnel — doughnut chart par rôle
  protected readonly personnelChartData = computed<ChartData<'doughnut'>>(() => {
    const parRole = this.resume()?.personnel?.par_role ?? {};
    const entries = Object.entries(parRole).filter(([, total]) => total > 0);
    return {
      labels: entries.map(([role]) => ROLE_LABELS[role] ?? role),
      datasets: [{ data: entries.map(([, total]) => total), backgroundColor: COULEURS }],
    };
  });
  protected readonly doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  // Paiements — line chart évolution mensuelle
  protected readonly paiementsChartData = computed<ChartData<'line'>>(() => {
    const evolution = this.resume()?.paiements?.evolution_mensuelle ?? [];
    return {
      labels: evolution.map((e) => e.libelle),
      datasets: [
        {
          data: evolution.map((e) => e.montant),
          label: 'Encaissé (FCFA)',
          borderColor: '#43a047',
          backgroundColor: 'rgba(67, 160, 71, 0.15)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  });
  protected readonly lineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: false } },
  };

  // Présence enseignants — bar chart présents / absents aujourd'hui
  protected readonly presenceChartData = computed<ChartData<'bar'>>(() => {
    const presence = this.resume()?.presence;
    const presents = presence?.presents_aujourdhui ?? 0;
    const absents = Math.max((presence?.enseignants_actifs ?? 0) - presents, 0);
    return {
      labels: ['Aujourd’hui'],
      datasets: [
        { data: [presents], label: 'Présents', backgroundColor: '#43a047' },
        { data: [absents], label: 'Absents', backgroundColor: '#e53935' },
      ],
    };
  });
  protected readonly presenceBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
    plugins: { legend: { position: 'bottom' } },
  };

  // Absences élèves — line chart évolution mensuelle
  protected readonly absencesChartData = computed<ChartData<'line'>>(() => {
    const evolution = this.resume()?.absences?.evolution_mensuelle ?? [];
    return {
      labels: evolution.map((e) => e.libelle),
      datasets: [
        {
          data: evolution.map((e) => e.total),
          label: 'Absences',
          borderColor: '#e53935',
          backgroundColor: 'rgba(229, 57, 53, 0.15)',
          fill: true,
          tension: 0.3,
        },
      ],
    };
  });

  ngOnInit(): void {
    this.dashboardService.resume().subscribe({
      next: (res) => {
        this.resume.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  }
}
