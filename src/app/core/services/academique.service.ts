import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnneeScolaire,
  Classe,
  ClasseAnnee,
  Matiere,
  Section,
} from '../models/academique.model';

@Injectable({ providedIn: 'root' })
export class AcademiqueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // Sections
  sections(): Observable<{ data: Section[] }> {
    return this.http.get<{ data: Section[] }>(`${this.apiUrl}/sections`);
  }

  // Classes (types de classe)
  classes(): Observable<{ data: Classe[] }> {
    return this.http.get<{ data: Classe[] }>(`${this.apiUrl}/classes`);
  }

  creerClasse(payload: { section_id: number; nom: string; niveau: number }): Observable<{ data: Classe }> {
    return this.http.post<{ data: Classe }>(`${this.apiUrl}/classes`, payload);
  }

  modifierClasse(id: number, payload: Partial<{ section_id: number; nom: string; niveau: number }>): Observable<{ data: Classe }> {
    return this.http.put<{ data: Classe }>(`${this.apiUrl}/classes/${id}`, payload);
  }

  supprimerClasse(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/classes/${id}`);
  }

  // Matières
  matieres(sectionId?: number): Observable<{ data: Matiere[] }> {
    const query = sectionId ? `?section_id=${sectionId}` : '';
    return this.http.get<{ data: Matiere[] }>(`${this.apiUrl}/matieres${query}`);
  }

  creerMatiere(payload: { section_id: number | null; nom: string; code: string }): Observable<{ data: Matiere }> {
    return this.http.post<{ data: Matiere }>(`${this.apiUrl}/matieres`, payload);
  }

  modifierMatiere(id: number, payload: Partial<{ section_id: number | null; nom: string; code: string }>): Observable<{ data: Matiere }> {
    return this.http.put<{ data: Matiere }>(`${this.apiUrl}/matieres/${id}`, payload);
  }

  supprimerMatiere(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/matieres/${id}`);
  }

  // Années scolaires
  anneesScolaires(): Observable<{ data: AnneeScolaire[] }> {
    return this.http.get<{ data: AnneeScolaire[] }>(`${this.apiUrl}/annees-scolaires`);
  }

  creerAnneeScolaire(payload: { libelle: string; date_debut: string; date_fin: string }): Observable<{ data: AnneeScolaire }> {
    return this.http.post<{ data: AnneeScolaire }>(`${this.apiUrl}/annees-scolaires`, payload);
  }

  activerAnneeScolaire(id: number): Observable<{ data: AnneeScolaire }> {
    return this.http.put<{ data: AnneeScolaire }>(`${this.apiUrl}/annees-scolaires/${id}/activer`, {});
  }

  supprimerAnneeScolaire(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/annees-scolaires/${id}`);
  }

  // Classes instanciées pour une année scolaire
  classesAnnee(anneeScolaireId: number): Observable<{ data: ClasseAnnee[] }> {
    return this.http.get<{ data: ClasseAnnee[] }>(`${this.apiUrl}/classes-annee?annee_scolaire_id=${anneeScolaireId}`);
  }

  genererClassesAnnee(anneeScolaireId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/classes-annee/generer`, { annee_scolaire_id: anneeScolaireId });
  }

  modifierEffectif(classeAnneeId: number, effectifMax: number | null): Observable<{ data: ClasseAnnee }> {
    return this.http.put<{ data: ClasseAnnee }>(`${this.apiUrl}/classes-annee/${classeAnneeId}`, { effectif_max: effectifMax });
  }

  assignerEnseignant(classeAnneeId: number, enseignantId: number): Observable<{ data: ClasseAnnee }> {
    return this.http.put<{ data: ClasseAnnee }>(`${this.apiUrl}/classes-annee/${classeAnneeId}/enseignant`, { enseignant_id: enseignantId });
  }

  retirerEnseignant(classeAnneeId: number): Observable<{ data: ClasseAnnee }> {
    return this.http.delete<{ data: ClasseAnnee }>(`${this.apiUrl}/classes-annee/${classeAnneeId}/enseignant`);
  }

  syncMatieres(classeAnneeId: number, matieres: { matiere_id: number; coefficient: number }[]): Observable<{ data: ClasseAnnee }> {
    return this.http.put<{ data: ClasseAnnee }>(`${this.apiUrl}/classes-annee/${classeAnneeId}/matieres`, { matieres });
  }

  effectifsPdf(anneeScolaireId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/classes-annee/effectifs/impression?annee_scolaire_id=${anneeScolaireId}`, {
      responseType: 'blob',
    });
  }
}
