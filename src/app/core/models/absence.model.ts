export interface Absence {
  id: number;
  eleve_id: number;
  eleve_nom: string;
  eleve_matricule: string;
  classe_annee_id: number;
  classe_nom: string;
  date: string;
  justifiee: boolean;
  motif: string | null;
  signale_par: string | null;
}
