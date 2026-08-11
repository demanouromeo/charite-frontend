import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FraisScolarite, Paiement, ScolariteEleve } from '../models/scolarite.model';

export interface BaremePayload {
  classe_id: number;
  annee_scolaire_id: number;
  montant_total: number;
  montant_tranche1: number;
  montant_tranche2: number;
  montant_tranche3: number;
}

export interface PaiementPayload {
  annee_scolaire_id: number;
  tranche: 1 | 2 | 3;
  montant: number;
  date_paiement: string;
}

@Injectable({ providedIn: 'root' })
export class ScolariteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  baremes(anneeScolaireId: number): Observable<{ data: FraisScolarite[] }> {
    return this.http.get<{ data: FraisScolarite[] }>(`${this.apiUrl}/frais-scolarite?annee_scolaire_id=${anneeScolaireId}`);
  }

  creerBareme(payload: BaremePayload): Observable<{ data: FraisScolarite }> {
    return this.http.post<{ data: FraisScolarite }>(`${this.apiUrl}/frais-scolarite`, payload);
  }

  modifierBareme(id: number, payload: Omit<BaremePayload, 'classe_id' | 'annee_scolaire_id'>): Observable<{ data: FraisScolarite }> {
    return this.http.put<{ data: FraisScolarite }>(`${this.apiUrl}/frais-scolarite/${id}`, payload);
  }

  supprimerBareme(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/frais-scolarite/${id}`);
  }

  scolariteEleve(eleveId: number, anneeScolaireId: number): Observable<{ data: ScolariteEleve }> {
    return this.http.get<{ data: ScolariteEleve }>(`${this.apiUrl}/eleves/${eleveId}/scolarite?annee_scolaire_id=${anneeScolaireId}`);
  }

  enregistrerPaiement(eleveId: number, payload: PaiementPayload): Observable<{ data: Paiement }> {
    return this.http.post<{ data: Paiement }>(`${this.apiUrl}/eleves/${eleveId}/paiements`, payload);
  }

  recuPdf(eleveId: number, paiementId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/eleves/${eleveId}/paiements/${paiementId}/recu`, { responseType: 'blob' });
  }

  insolvablesPdf(classeAnneeId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/scolarite/insolvables?classe_annee_id=${classeAnneeId}`, { responseType: 'blob' });
  }
}
