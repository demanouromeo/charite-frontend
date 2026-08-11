export interface Sequence {
  id: number;
  numero: number;
  numero_global: number;
  libelle: string;
  verrouille: boolean;
  trimestre_id: number;
}

export interface Trimestre {
  id: number;
  numero: number;
  libelle: string;
  annee_scolaire_id: number;
  sequences: Sequence[];
}

export interface MatiereGrille {
  classe_matiere_id: number;
  matiere_id: number;
  nom: string;
  coefficient: number;
}

export interface EleveGrille {
  id: number;
  matricule: string;
  nom_complet: string;
}

export interface NoteSaisie {
  eleve_id: number;
  classe_matiere_id: number;
  note: number;
}

export interface GrilleNotes {
  sequence: Sequence;
  classe_annee: { id: number; nom: string };
  matieres: MatiereGrille[];
  eleves: EleveGrille[];
  notes: NoteSaisie[];
}

export type PeriodeType = 'sequence' | 'trimestre' | 'annuel';

export interface MatiereMoyenne {
  matiere: string;
  coefficient: number;
  moyenne: number | null;
}

export interface StatistiqueClasse {
  classe_annee_id: number;
  nom: string;
  effectif: number;
  effectif_note: number;
  moyenne_classe: number | null;
  taux_reussite: number | null;
}

export interface StatistiqueMatiere {
  matiere: string;
  moyenne: number;
  nombre_notes: number;
}

export interface StatistiquesDashboard {
  par_classe: StatistiqueClasse[];
  par_matiere: StatistiqueMatiere[];
  global: {
    moyenne_generale: number | null;
    taux_reussite: number | null;
    meilleure_classe: string | null;
    classe_la_plus_faible: string | null;
  };
}
