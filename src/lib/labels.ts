export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  journalier: 'Journalier',
  hebdomadaire: 'Hebdomadaire',
  mensuel: 'Mensuel',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  preparation: 'En attente',
  en_cours: 'En cours',
  termine: 'Terminé',
  pause: 'Suspendu',
};

export const PHASE_STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  en_cours: 'En cours',
  termine: 'Terminé',
  bloque: 'Bloqué',
};

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  en_service: 'En service',
  en_transit: 'En transit',
  en_maintenance: 'En maintenance',
  hors_service: 'Hors service',
};

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  materiaux: 'Matériaux',
  main_d_oeuvre: "Main d'œuvre",
  transport: 'Transport',
  divers: 'Divers',
};

export function label(map: Record<string, string>, value: string | null | undefined): string {
  if (!value) return '';
  return map[value] ?? value;
}
