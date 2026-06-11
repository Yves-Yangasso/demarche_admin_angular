export interface Utilisateur {
  id: number;
  uuid: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  role: 'citoyen' | 'agent' | 'admin' | 'super_admin';
  langue: string;
  photo_url?: string;
  qr_code_url?: string;
  telephone?: string;
  email?: string;
  password?: string;
  collectivite_id?: number;
  role_organisation_id?: number;
  two_factor_enabled?: boolean;
}

export interface Collectivite {
  id: number;
  code: string;
  nom: string;
  type: string;
  region?: string;
  departement?: string;
  latitude?: number;
  longitude?: number;
  actif: boolean;
}

export interface Dossier {
  id: number;
  numero: string;
  titre: string;
  description: string;
  statut: string;
  priorite: string;
  date_soumission: string;
  date_echeance?: string;
  citoyen_id: number;
  agent_id?: number;
  collectivite_id: number;
  type_demarche_id: number;
  citoyen?: Utilisateur;
  agent?: Utilisateur;
  collectivite?: Collectivite;
}
