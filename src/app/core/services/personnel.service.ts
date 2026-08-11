import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Role, User } from '../models/user.model';

export interface CreatePersonnelPayload {
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  sexe?: 'M' | 'F' | '';
  anciennete_date?: string;
  role: Role;
  password: string;
}

export type UpdatePersonnelPayload = Partial<Omit<CreatePersonnelPayload, 'role' | 'password'>>;

@Injectable({ providedIn: 'root' })
export class PersonnelService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/personnel`;

  list(filters: { role?: string; statut?: string } = {}): Observable<{ data: User[] }> {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    return this.http.get<{ data: User[] }>(`${this.baseUrl}${params ? '?' + params : ''}`);
  }

  create(payload: CreatePersonnelPayload): Observable<{ data: User }> {
    return this.http.post<{ data: User }>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdatePersonnelPayload): Observable<{ data: User }> {
    return this.http.put<{ data: User }>(`${this.baseUrl}/${id}`, payload);
  }

  updateRole(id: number, role: Role): Observable<{ data: User }> {
    return this.http.put<{ data: User }>(`${this.baseUrl}/${id}/role`, { role });
  }

  updateStatut(id: number, statut: 'actif' | 'inactif'): Observable<{ data: User }> {
    return this.http.put<{ data: User }>(`${this.baseUrl}/${id}/statut`, { statut });
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  listePdf(filters: { role?: string; statut?: string } = {}): Observable<Blob> {
    const params = new URLSearchParams(filters as Record<string, string>).toString();
    return this.http.get(`${this.baseUrl}/impression${params ? '?' + params : ''}`, { responseType: 'blob' });
  }
}
