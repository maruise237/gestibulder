/** Jours ouvrés conventionnels utilisés pour convertir un salaire hebdomadaire
 *  ou mensuel en équivalent journalier (utilisé pour le calcul de paie basé
 *  sur le pointage). Convention courante dans le BTP : semaine de 6 jours. */
const JOURS_OUVRES_SEMAINE = 6;
const JOURS_OUVRES_MOIS = 26;

/**
 * Calcule le taux journalier effectif d'un ouvrier, quel que soit son cycle
 * de paie (journalier, hebdomadaire ou mensuel). Sans cette conversion, les
 * ouvriers payés à la semaine ou au mois se retrouveraient avec un
 * salaire_jour de 0 sur chaque pointage, et donc un montant dû toujours nul,
 * puisque tout le système de paie (getWorkerSalariesDue, getProjectLaborSummary,
 * la RPC calculer_paiement_ouvrier) est basé sur la somme des salaire_jour.
 */
export function getTauxJournalierEffectif(worker: {
  type_paiement: string;
  taux_journalier?: number | null;
  salaire_hebdo?: number | null;
  salaire_mensuel?: number | null;
}): number {
  switch (worker.type_paiement) {
    case 'hebdomadaire':
      return (worker.salaire_hebdo || 0) / JOURS_OUVRES_SEMAINE;
    case 'mensuel':
      return (worker.salaire_mensuel || 0) / JOURS_OUVRES_MOIS;
    case 'journalier':
    default:
      return worker.taux_journalier || 0;
  }
}
