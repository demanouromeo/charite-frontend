import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

/**
 * Utilisation dans les routes : { data: { roles: ['administrateur', 'econome'] } }
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = route.data['roles'] as Role[] | undefined;

  if (!allowedRoles || allowedRoles.length === 0 || authService.hasRole(...allowedRoles)) {
    return true;
  }

  return router.parseUrl('/acces-refuse');
};
