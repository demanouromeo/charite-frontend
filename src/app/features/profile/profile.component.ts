import { HttpClient } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly snackBar = inject(MatSnackBar);
  protected readonly authService = inject(AuthService);

  protected readonly savingInfo = signal(false);
  protected readonly savingPassword = signal(false);

  protected readonly infoForm = this.fb.nonNullable.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    telephone: [''],
    email: ['', [Validators.required, Validators.email]],
    sexe: [''],
    anciennete_date: [''],
  });

  protected readonly passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.infoForm.patchValue({
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone ?? '',
        email: user.email,
        sexe: user.sexe ?? '',
        anciennete_date: user.anciennete_date ?? '',
      });
    }
  }

  saveInfo(): void {
    if (this.infoForm.invalid) {
      this.infoForm.markAllAsTouched();
      return;
    }

    this.savingInfo.set(true);
    this.http.put<{ data: User }>(`${environment.apiUrl}/profile`, this.infoForm.getRawValue()).subscribe({
      next: () => {
        this.savingInfo.set(false);
        this.authService.refreshCurrentUser().subscribe();
        this.snackBar.open('Informations mises à jour.', 'Fermer', { duration: 3000 });
      },
      error: () => {
        this.savingInfo.set(false);
        this.snackBar.open('Échec de la mise à jour.', 'Fermer', { duration: 3000 });
      },
    });
  }

  savePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.savingPassword.set(true);
    this.http.put(`${environment.apiUrl}/profile/password`, this.passwordForm.getRawValue()).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.passwordForm.reset();
        this.snackBar.open('Mot de passe mis à jour.', 'Fermer', { duration: 3000 });
      },
      error: (err) => {
        this.savingPassword.set(false);
        const message = err.error?.errors?.current_password?.[0] ?? 'Échec de la mise à jour du mot de passe.';
        this.snackBar.open(message, 'Fermer', { duration: 4000 });
      },
    });
  }
}
