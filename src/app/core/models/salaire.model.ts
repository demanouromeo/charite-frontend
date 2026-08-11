import { Role } from './user.model';

export type StatutSalaire = 'paye' | 'non_paye';

export interface Salaire {
  id: number;
  user_id: number;
  user: {
    id: number;
    matricule: string | null;
    nom_complet: string;
    roles: Role[];
  } | null;
  salaire_base: number;
  primes: number;
  retenues: number;
  montant_net: number;
  mois: number;
  mois_libelle: string;
  annee: number;
  statut: StatutSalaire;
  date_paiement: string | null;
  paye_par: string | null;
}
