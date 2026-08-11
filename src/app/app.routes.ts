import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'mot-de-passe-oublie',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },
      {
        path: 'tableau-de-bord',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'profil',
        loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'personnel',
        loadComponent: () =>
          import('./features/personnel/personnel-list/personnel-list.component').then((m) => m.PersonnelListComponent),
      },
      {
        path: 'academique',
        loadComponent: () => import('./features/academique/academique.component').then((m) => m.AcademiqueComponent),
      },
      {
        path: 'eleves',
        loadComponent: () =>
          import('./features/eleves/eleves-list/eleves-list.component').then((m) => m.ElevesListComponent),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('./features/notes/notes-saisie/notes-saisie.component').then((m) => m.NotesSaisieComponent),
      },
      {
        path: 'statistiques',
        loadComponent: () =>
          import('./features/statistiques/statistiques.component').then((m) => m.StatistiquesComponent),
      },
      {
        path: 'pointage',
        loadComponent: () => import('./features/pointage/pointage.component').then((m) => m.PointageComponent),
      },
      {
        path: 'absences',
        loadComponent: () => import('./features/absences/absences.component').then((m) => m.AbsencesComponent),
      },
      {
        path: 'discipline',
        loadComponent: () => import('./features/discipline/discipline.component').then((m) => m.DisciplineComponent),
      },
      {
        path: 'paie',
        loadComponent: () => import('./features/paie/paie-list/paie-list.component').then((m) => m.PaieListComponent),
      },
      {
        path: 'bulletins',
        loadComponent: () => import('./features/bulletins/bulletins.component').then((m) => m.BulletinsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
