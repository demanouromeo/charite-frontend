import { AnneeScolaire, Classe } from './academique.model';

export interface FraisScolarite {
  id: number;
  classe: Classe;
  annee_scolaire: AnneeScolaire;
  montant_total: number;
  montant_tranche1: number;
  montant_tranche2: number;
  montant_tranche3: number;
}

export interface Paiement {
  id: number;
  tranche: 1 | 2 | 3;
  montant: number;
  mode: string;
  date_paiement: string;
  recu_numero: string;
  encaisse_par: string | null;
}

export interface ScolariteEleve {
  bareme: FraisScolarite | null;
  paiements: Paiement[];
  montant_paye: number;
  solde: number;
}
