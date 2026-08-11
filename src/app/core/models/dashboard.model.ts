export interface ResumeClasse {
  nom: string;
  effectif: number;
  effectif_max: number | null;
}

export interface ResumeClasses {
  total: number;
  par_classe: ResumeClasse[];
}

export interface ResumeEleves {
  total: number;
  garcons: number;
  filles: number;
}

export interface ResumePersonnel {
  total: number;
  par_role: Record<string, number>;
}

export interface ResumePresence {
  enseignants_actifs: number;
  presents_aujourdhui: number;
  taux_presence_jour: number | null;
}

export interface EvolutionMensuelleMontant {
  libelle: string;
  montant: number;
}

export interface ResumePaiements {
  montant_attendu: number;
  montant_collecte: number;
  taux_recouvrement: number | null;
  evolution_mensuelle: EvolutionMensuelleMontant[];
}

export interface EvolutionMensuelleTotal {
  libelle: string;
  total: number;
}

export interface ResumeAbsences {
  mois_courant: number;
  evolution_mensuelle: EvolutionMensuelleTotal[];
}

export interface DashboardResume {
  annee_scolaire: { id: number; libelle: string } | null;
  classes?: ResumeClasses;
  eleves?: ResumeEleves;
  personnel?: ResumePersonnel;
  presence?: ResumePresence;
  paiements?: ResumePaiements;
  absences?: ResumeAbsences;
}
