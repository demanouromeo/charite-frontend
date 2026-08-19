import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models/user.model';
import { environment } from '../../../environments/environment';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: Role[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Tableau de bord', icon: 'dashboard', route: '/tableau-de-bord' },
  {
    label: 'Personnel',
    icon: 'groups',
    route: '/personnel',
    roles: ['administrateur', 'secretaire'],
  },
  {
    label: 'Classes & académique',
    icon: 'school',
    route: '/academique',
    roles: ['administrateur', 'secretaire', 'econome'],
  },
  {
    label: 'Élèves',
    icon: 'diversity_3',
    route: '/eleves',
    roles: ['administrateur', 'secretaire', 'econome'],
  },
  {
    label: 'Notes',
    icon: 'edit_note',
    route: '/notes',
    roles: ['administrateur', 'secretaire', 'enseignant'],
  },
  {
    label: 'Statistiques',
    icon: 'bar_chart',
    route: '/statistiques',
    roles: ['administrateur'],
  },
  {
    label: 'Impression bulletins',
    icon: 'print',
    route: '/bulletins',
    roles: ['administrateur', 'secretaire'],
  },
  {
    label: 'Pointage',
    icon: 'schedule',
    route: '/pointage',
    roles: ['administrateur', 'secretaire', 'enseignant'],
  },
  {
    label: 'Absences',
    icon: 'event_busy',
    route: '/absences',
    roles: ['administrateur', 'secretaire', 'enseignant'],
  },
  {
    label: 'Discipline',
    icon: 'gavel',
    route: '/discipline',
    roles: ['administrateur', 'secretaire', 'enseignant'],
  },
  {
    label: 'Paie du personnel',
    icon: 'payments',
    route: '/paie',
    roles: ['administrateur', 'econome'],
  },
  { label: 'Mon profil', icon: 'account_circle', route: '/profil' },
];

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly ecole = environment.ecole;

  protected readonly menuItems = computed(() =>
    MENU_ITEMS.filter((item) => !item.roles || this.authService.hasRole(...item.roles)),
  );

  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isHandset = signal(false);

  constructor(protected readonly authService: AuthService) {
    this.breakpointObserver
      .observe([Breakpoints.Handset, Breakpoints.TabletPortrait, '(max-width: 900px)'])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.isHandset.set(result.matches));
  }

  logout(): void {
    this.authService.logout();
  }
}
