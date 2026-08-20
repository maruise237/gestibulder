/**
 * Retourne le taux journalier d'un ouvrier. Le montant saisi représente
 * TOUJOURS un taux journalier, quel que soit le cycle de paie choisi
 * (journalier/hebdomadaire/mensuel) — le cycle détermine uniquement quand
 * l'ouvrier est payé (chaque jour, chaque fin de semaine, chaque fin de
 * mois), pas comment le montant journalier est calculé. On ne divise donc
 * jamais le montant saisi : diviser un salaire hebdomadaire par 6 pour en
 * déduire un "équivalent journalier" ne correspond pas à la façon dont les
 * chantiers rémunèrent réellement leurs ouvriers, et le montant défini par
 * l'utilisateur doit toujours être respecté tel quel.
 */
export function getTauxJournalierEffectif(worker: {
  type_paiement: string;
  taux_journalier?: number | null;
  salaire_hebdo?: number | null;
  salaire_mensuel?: number | null;
}): number {
  return worker.taux_journalier || worker.salaire_hebdo || worker.salaire_mensuel || 0;
}
