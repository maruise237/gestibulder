export interface Attendance {
  id: string;
  entreprise_id: string;
  chantier_id: string;
  ouvrier_id: string;
  date: string;
  statut: 'present' | 'absent' | 'absent_justifie';
  heure_arrivee?: string;
  heure_depart?: string;
  quantite_produite: number;
  note?: string;
  saisi_par: string;
  salaire_jour?: number;
  created_at: string;
}

export type NewAttendance = Omit<
  Attendance,
  'id' | 'created_at' | 'entreprise_id' | 'saisi_par' | 'salaire_jour'
>;
