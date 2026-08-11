import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Absence } from '../models/absence.model';

export interface AbsenceFiltres {
  classe_annee_id?: number;
  eleve_id?: number;
  date?: string;
}

export interface MarquerAbsencePayload {
  eleve_id: number;
  classe_annee_id: number;
  date: string;
  justifiee: boolean;
  motif?: string;
}

function versParams(filtres: AbsenceFiltres): string {
  const entrees = Object.entries(filtres).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const params = new URLSearchParams(Object.fromEntries(entrees.map(([k, v]) => [k, String(v)])));
  const chaine = params.toString();
  return chaine ? `?${chaine}` : '';
}

@Injectable({ providedIn: 'root' })
export class AbsenceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/absences`;

  liste(filtres: AbsenceFiltres = {}): Observable<{ data: Absence[] }> {
    return this.http.get<{ data: Absence[] }>(`${this.baseUrl}${versParams(filtres)}`);
  }

  marquer(payload: MarquerAbsencePayload): Observable<{ data: Absence }> {
    return this.http.post<{ data: Absence }>(this.baseUrl, payload);
  }

  modifier(id: number, payload: { justifiee: boolean; motif?: string }): Observable<{ data: Absence }> {
    return this.http.put<{ data: Absence }>(`${this.baseUrl}/${id}`, payload);
  }

  supprimer(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }
}
