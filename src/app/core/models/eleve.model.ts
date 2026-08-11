import { AnneeScolaire, Classe } from './academique.model';

export type SexeEleve = 'M' | 'F';
export type StatutEleve = 'actif' | 'exclu' | 'parti';

export interface Inscription {
  id: number;
  date_inscription: string;
  frais_inscription_du: number;
  frais_inscription_paye: number;
  annee_scolaire: AnneeScolaire;
  classe_annee: { id: number; classe: Classe };
}

export interface Exclusion {
  id: number;
  motif: string;
  date_exclusion: string;
  decide_par: string | null;
}

export interface Eleve {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  date_naissance: string | null;
  sexe: SexeEleve;
  photo: string | null;
  nom_pere: string | null;
  nom_mere: string | null;
  contact_tuteur: string | null;
  adresse: string | null;
  statut: StatutEleve;
  inscription_courante?: Inscription | null;
  inscriptions?: Inscription[];
  exclusions?: Exclusion[];
}
