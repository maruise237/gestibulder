export interface Equipment {
  id: string;
  entreprise_id: string;
  nom: string;
  categorie: string;
  numero_serie?: string;
  etat: 'disponible' | 'en_service' | 'en_transit' | 'en_maintenance' | 'hors_service';
  created_at: string;
}

export type NewEquipment = Omit<Equipment, 'id' | 'created_at' | 'entreprise_id'>;
