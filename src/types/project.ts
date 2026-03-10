export type ProjectStatus = 'preparation' | 'en_cours' | 'pause' | 'termine';

export interface Project {
  id: string;
  entreprise_id: string;
  nom: string;
  adresse: string | null;
  date_debut: string | null;
  date_fin_prevue: string | null;
  budget_total: number;
  statut: ProjectStatus;
  avancement_pct: number;
  superviseur_ids: string[];
  created_at: string;
}

export type NewProject = Omit<Project, 'id' | 'created_at' | 'entreprise_id'>;
