export interface Section {
  id: number;
  nom: string;
  code: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: number;
  section: Section;
}

export interface Matiere {
  id: number;
  nom: string;
  code: string;
  section: Section | null;
}

export interface AnneeScolaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  is_active: boolean;
}

export interface MatiereCoefficient {
  classe_matiere_id: number;
  matiere_id: number;
  nom: string;
  code: string;
  coefficient: number;
}

export interface EnseignantPrincipal {
  id: number;
  nom_complet: string;
}

export interface ClasseAnnee {
  id: number;
  effectif_max: number | null;
  effectif_actuel?: number;
  classe: Classe;
  annee_scolaire: AnneeScolaire;
  enseignant_principal: EnseignantPrincipal | null;
  matieres: MatiereCoefficient[];
}
