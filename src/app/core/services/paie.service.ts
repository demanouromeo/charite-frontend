import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Salaire } from '../models/salaire.model';

export interface SalairePayload {
  user_id: number;
  salaire_base: number;
  primes?: number;
  retenues?: number;
  mois: number;
  annee: number;
}

export type UpdateSalairePayload = Pick<SalairePayload, 'salaire_base' | 'primes' | 'retenues'>;

export interface SalaireFiltres {
  user_id?: number;
  mois?: number;
  annee?: number;
  statut?: StatutFiltre;
}

export type StatutFiltre = 'paye' | 'non_paye' | '';

@Injectable({ providedIn: 'root' })
export class PaieService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/salaires`;

  list(filtres: SalaireFiltres = {}): Observable<{ data: Salaire[] }> {
    const params: Record<string, string> = {};
    Object.entries(filtres).forEach(([cle, valeur]) => {
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        params[cle] = String(valeur);
      }
    });
    const query = new URLSearchParams(params).toString();
    return this.http.get<{ data: Salaire[] }>(`${this.baseUrl}${query ? '?' + query : ''}`);
  }

  create(payload: SalairePayload): Observable<{ data: Salaire }> {
    return this.http.post<{ data: Salaire }>(this.baseUrl, payload);
  }

  update(id: number, payload: UpdateSalairePayload): Observable<{ data: Salaire }> {
    return this.http.put<{ data: Salaire }>(`${this.baseUrl}/${id}`, payload);
  }

  payer(id: number): Observable<{ data: Salaire }> {
    return this.http.put<{ data: Salaire }>(`${this.baseUrl}/${id}/payer`, {});
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`);
  }

  bulletinPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/bulletin`, { responseType: 'blob' });
  }
}
