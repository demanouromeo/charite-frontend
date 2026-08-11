export interface Pointage {
  id: number;
  enseignant_id: number;
  enseignant_nom: string;
  date: string;
  heure_arrivee: string | null;
  heure_depart: string | null;
  saisi_par: string | null;
  modifie_par: string | null;
  modifie_le: string | null;
}
