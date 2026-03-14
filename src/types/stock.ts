export interface Material {
  id: string;
  entreprise_id: string;
  chantier_id: string;
  nom: string;
  unite: string;
  seuil_alerte: number;
  created_at: string;
  // Calculated fields (virtual)
  stock_actuel?: number;
}

export interface StockMovement {
  id: string;
  entreprise_id: string;
  chantier_id: string;
  materiau_id: string;
  type_mouvement: 'entree' | 'sortie';
  quantite: number;
  cout_unitaire?: number;
  date_operation: string;
  saisi_par: string;
  fournisseur?: string;
  usage?: string;
  created_at: string;
}

export type NewMaterial = Omit<Material, 'id' | 'created_at' | 'entreprise_id'>;
export type NewStockMovement = Omit<
  StockMovement,
  'id' | 'created_at' | 'entreprise_id' | 'saisi_par'
>;
