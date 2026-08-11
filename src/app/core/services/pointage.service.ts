import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Pointage } from '../models/pointage.model';

export interface PointageFiltres {
  enseignant_id?: number;
  date?: string;
  mois?: number;
  annee?: number;
}

export interface EnregistrerPointagePayload {
  enseignant_id: number;
  date: string;
  heure_arrivee?: string;
  heure_depart?: string;
}

function versParams(filtres: PointageFiltres): string {
  const entrees = Object.entries(filtres).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const params = new URLSearchParams(Object.fromEntries(entrees.map(([k, v]) => [k, String(v)])));
  const chaine = params.toString();
  return chaine ? `?${chaine}` : '';
}

@Injectable({ providedIn: 'root' })
export class PointageService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/pointages`;

  liste(filtres: PointageFiltres = {}): Observable<{ data: Pointage[] }> {
    return this.http.get<{ data: Pointage[] }>(`${this.baseUrl}${versParams(filtres)}`);
  }

  enregistrer(payload: EnregistrerPointagePayload): Observable<{ data: Pointage }> {
    return this.http.post<{ data: Pointage }>(this.baseUrl, payload);
  }
}
