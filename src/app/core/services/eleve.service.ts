import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Eleve, Inscription, SexeEleve } from '../models/eleve.model';

export interface CreateElevePayload {
  nom: string;
  prenom: string;
  sexe: SexeEleve;
  date_naissance?: string;
  nom_pere?: string;
  nom_mere?: string;
  contact_tuteur?: string;
  adresse?: string;
  classe_annee_id: number;
  date_inscription: string;
  frais_inscription_du: number;
  frais_inscription_paye?: number;
}

export interface UpdateElevePayload {
  nom: string;
  prenom: string;
  sexe: SexeEleve;
  date_naissance?: string;
  nom_pere?: string;
  nom_mere?: string;
  contact_tuteur?: string;
  adresse?: string;
}

export interface InscrirePayload {
  classe_annee_id: number;
  date_inscription: string;
  frais_inscription_du: number;
  frais_inscription_paye?: number;
}

export interface EleveFiltres {
  classe_annee_id?: number;
  annee_scolaire_id?: number;
  statut?: string;
  recherche?: string;
}

function versParams(filtres: EleveFiltres): string {
  const entrees = Object.entries(filtres).filter(([, v]) => v !== undefined && v !== null && v !== '');
  const params = new URLSearchParams(Object.fromEntries(entrees.map(([k, v]) => [k, String(v)])));
  const chaine = params.toString();
  return chaine ? `?${chaine}` : '';
}

@Injectable({ providedIn: 'root' })
export class EleveService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/eleves`;

  list(filtres: EleveFiltres = {}): Observable<{ data: Eleve[] }> {
    return this.http.get<{ data: Eleve[] }>(`${this.baseUrl}${versParams(filtres)}`);
  }

  get(id: number): Observable<{ data: Eleve }> {
    return this.http.get<{ data: Eleve }>(`${this.baseUrl}/${id}`);
  }

  create(payload: CreateElevePayload): Observable<{ data: Eleve }> {
    return this.http.post<{ data: Eleve }>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateElevePayload): Observable<{ data: Eleve }> {
    return this.http.put<{ data: Eleve }>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  exclure(id: number, payload: { motif: string; date_exclusion: string }): Observable<{ data: Eleve }> {
    return this.http.post<{ data: Eleve }>(`${this.baseUrl}/${id}/exclure`, payload);
  }

  reintegrer(id: number): Observable<{ data: Eleve }> {
    return this.http.put<{ data: Eleve }>(`${this.baseUrl}/${id}/reintegrer`, {});
  }

  inscriptions(id: number): Observable<{ data: Inscription[] }> {
    return this.http.get<{ data: Inscription[] }>(`${this.baseUrl}/${id}/inscriptions`);
  }

  inscrire(id: number, payload: InscrirePayload): Observable<{ data: Inscription }> {
    return this.http.post<{ data: Inscription }>(`${this.baseUrl}/${id}/inscriptions`, payload);
  }

  listePdf(filtres: EleveFiltres = {}): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/impression${versParams(filtres)}`, { responseType: 'blob' });
  }
}
