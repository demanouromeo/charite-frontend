import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CommentaireDiscipline } from '../models/discipline.model';

@Injectable({ providedIn: 'root' })
export class DisciplineService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/discipline`;

  liste(eleveId?: number): Observable<{ data: CommentaireDiscipline[] }> {
    const qs = eleveId ? `?eleve_id=${eleveId}` : '';
    return this.http.get<{ data: CommentaireDiscipline[] }>(`${this.baseUrl}${qs}`);
  }

  ajouter(payload: { eleve_id: number; contenu: string; date: string }): Observable<{ data: CommentaireDiscipline }> {
    return this.http.post<{ data: CommentaireDiscipline }>(this.baseUrl, payload);
  }

  modifier(id: number, contenu: string): Observable<{ data: CommentaireDiscipline }> {
    return this.http.put<{ data: CommentaireDiscipline }>(`${this.baseUrl}/${id}`, { contenu });
  }
}
