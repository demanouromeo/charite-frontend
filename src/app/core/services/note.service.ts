import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GrilleNotes,
  NoteSaisie,
  PeriodeType,
  Sequence,
  StatistiquesDashboard,
  Trimestre,
} from '../models/note.model';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  trimestres(anneeScolaireId: number): Observable<{ data: Trimestre[] }> {
    return this.http.get<{ data: Trimestre[] }>(`${this.apiUrl}/annees-scolaires/${anneeScolaireId}/trimestres`);
  }

  verrouiller(sequenceId: number): Observable<{ data: Sequence }> {
    return this.http.put<{ data: Sequence }>(`${this.apiUrl}/sequences/${sequenceId}/verrouiller`, {});
  }

  deverrouiller(sequenceId: number): Observable<{ data: Sequence }> {
    return this.http.put<{ data: Sequence }>(`${this.apiUrl}/sequences/${sequenceId}/deverrouiller`, {});
  }

  grille(classeAnneeId: number, sequenceId: number): Observable<{ data: GrilleNotes }> {
    return this.http.get<{ data: GrilleNotes }>(`${this.apiUrl}/classes-annee/${classeAnneeId}/sequences/${sequenceId}/notes`);
  }

  enregistrer(classeAnneeId: number, sequenceId: number, notes: NoteSaisie[]): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/classes-annee/${classeAnneeId}/sequences/${sequenceId}/notes`, { notes });
  }

  bulletinSequentielPdf(eleveId: number, sequenceId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/eleves/${eleveId}/bulletins/sequentiel/${sequenceId}`, { responseType: 'blob' });
  }

  bulletinTrimestrielPdf(eleveId: number, trimestreId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/eleves/${eleveId}/bulletins/trimestriel/${trimestreId}`, { responseType: 'blob' });
  }

  bulletinAnnuelPdf(eleveId: number, anneeScolaireId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/eleves/${eleveId}/bulletins/annuel/${anneeScolaireId}`, { responseType: 'blob' });
  }

  tableauHonneurPdf(classeAnneeId: number, type: PeriodeType, periodeId: number, top = 3): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/classes-annee/${classeAnneeId}/tableau-honneur?type=${type}&periode_id=${periodeId}&top=${top}`, {
      responseType: 'blob',
    });
  }

  tableauHonneurGlobalPdf(anneeScolaireId: number, type: PeriodeType, periodeId: number, top = 3): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/annees-scolaires/${anneeScolaireId}/tableau-honneur?type=${type}&periode_id=${periodeId}&top=${top}`,
      { responseType: 'blob' },
    );
  }

  bulletinsClasseTrimestrielPdf(classeAnneeId: number, trimestreId: number, eleveIds?: number[]): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/classes-annee/${classeAnneeId}/bulletins/trimestriel/${trimestreId}${this.eleveIdsQuery(eleveIds)}`,
      { responseType: 'blob' },
    );
  }

  bulletinsClasseAnnuelPdf(classeAnneeId: number, anneeScolaireId: number, eleveIds?: number[]): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/classes-annee/${classeAnneeId}/bulletins/annuel/${anneeScolaireId}${this.eleveIdsQuery(eleveIds)}`,
      { responseType: 'blob' },
    );
  }

  private eleveIdsQuery(eleveIds?: number[]): string {
    if (!eleveIds || eleveIds.length === 0) return '';
    return '?' + eleveIds.map((id) => `eleve_ids[]=${id}`).join('&');
  }

  statistiques(anneeScolaireId: number, type: PeriodeType, periodeId: number): Observable<{ data: StatistiquesDashboard }> {
    return this.http.get<{ data: StatistiquesDashboard }>(
      `${this.apiUrl}/statistiques/dashboard?annee_scolaire_id=${anneeScolaireId}&type=${type}&periode_id=${periodeId}`,
    );
  }
}
