export interface Expense {
  id: string;
  created_at: string;
  libelle: string;
  montant: number;
  categorie: 'materiaux' | 'main_d_oeuvre' | 'transport' | 'divers';
  date: string;
  chantier_id: string;
  entreprise_id: string;
}

export type NewExpense = Omit<Expense, 'id' | 'created_at'>;
