export interface CommentaireDiscipline {
  id: number;
  eleve_id: number;
  eleve_nom?: string;
  contenu: string;
  date: string;
  saisi_par: string | null;
  modifiable: boolean;
}
