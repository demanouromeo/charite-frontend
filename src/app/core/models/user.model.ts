export type Role = 'administrateur' | 'econome' | 'secretaire' | 'enseignant';

export interface User {
  id: number;
  matricule: string | null;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  telephone: string | null;
  sexe: 'M' | 'F' | null;
  photo: string | null;
  anciennete_date: string | null;
  statut: 'actif' | 'inactif';
  roles: Role[];
  permissions: string[];
}

export interface LoginResponse {
  token: string;
  user: User;
}
