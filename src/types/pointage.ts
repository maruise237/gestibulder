export type PointageStatut = 'present' | 'absent' | 'demi_journee';

export interface Pointage {
  id: string;
  entreprise_id: string;
  chantier_id: string;
  ouvrier_id: string;
  date: string;
  statut: PointageStatut;
  heure_arrivee?: string;
  heure_depart?: string;
  salaire_jour: number;
  created_at?: string;
}

export interface PointageWithOuvrier extends Pointage {
  ouvrier: {
    nom_complet: string;
    metier: string;
    taux_journalier: number;
  };
}

export interface PointageStats {
  ouvrier_id: string;
  nom_complet: string;
  jours_present: number;
  jours_absent: number;
  demi_journees: number;
  total_salaire: number;
}
