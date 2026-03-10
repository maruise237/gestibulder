export interface Worker {
  id: string;
  entreprise_id: string;
  chantier_ids: string[];
  nom_complet: string;
  telephone?: string;
  metier: string;
  metier_custom?: string;
  unite_production: string;
  type_paiement: 'journalier' | 'hebdomadaire' | 'mensuel';
  taux_journalier?: number;
  salaire_hebdo?: number;
  salaire_mensuel?: number;
  actif: boolean;
  created_at: string;
}

export type NewWorker = Omit<Worker, 'id' | 'created_at' | 'entreprise_id'>;
