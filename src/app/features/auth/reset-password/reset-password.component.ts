import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmation = control.get('password_confirmation')?.value;
  return password && confirmation && password !== confirmation ? { mismatch: true } : null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  protected readonly ecole = environment.ecole;
  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  private readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';

  protected readonly form = this.fb.nonNullable.group(
    {
      email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatchValidator },
  );

  submit(): void {
    if (this.form.invalid || !this.token) {
      this.form.markAllAsTouched();
      if (!this.token) {
        this.errorMessage.set('Lien de réinitialisation invalide.');
      }
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    const { email, password, password_confirmation } = this.form.getRawValue();

    this.authService.resetPassword({ token: this.token, email, password, password_confirmation }).subscribe({
      next: () => {
        this.loading.set(false);
        this.snackBar.open('Mot de passe réinitialisé. Vous pouvez vous connecter.', 'Fermer', { duration: 4000 });
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err.error?.errors?.email?.[0] ?? "Impossible de réinitialiser le mot de passe. Le lien a peut-être expiré.",
        );
      },
    });
  }
}
