'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';
import { PointageStatut, PointageWithOuvrier, PointageStats } from '@/types/pointage';

/**
 * Retourne les pointages d'un chantier pour une date donnée
 */
export async function getPointagesByChantier(chantierId: string, date: string = new Date().toISOString().split('T')[0]) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pointages')
    .select(`
      *,
      ouvrier:ouvriers(nom_complet, metier, taux_journalier)
    `)
    .eq('entreprise_id', entreprise_id)
    .eq('chantier_id', chantierId)
    .eq('date', date);

  if (error) {
    console.error('Error fetching pointages:', error);
    return { error: error.message };
  }

  return { pointages: data as PointageWithOuvrier[] };
}

/**
 * Upsert un pointage avec calcul automatique du salaire
 */
export async function upsertPointage(data: {
  ouvrier_id: string;
  chantier_id: string;
  date: string;
  statut: PointageStatut;
  heure_arrivee?: string;
  heure_depart?: string;
}) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  // 1. Récupérer le taux journalier de l'ouvrier
  const { data: ouvrier, error: ouvrierError } = await supabase
    .from('ouvriers')
    .select('taux_journalier')
    .eq('id', data.ouvrier_id)
    .single();

  if (ouvrierError || !ouvrier) {
    return { error: "Ouvrier non trouvé" };
  }

  // 2. Calculer le salaire journalier
  let salaire_jour = 0;
  const taux = ouvrier.taux_journalier || 0;

  if (data.statut === 'present') {
    salaire_jour = taux;
  } else if (data.statut === 'demi_journee') {
    salaire_jour = taux / 2;
  }

  // 3. Upsert
  const { data: pointage, error } = await supabase
    .from('pointages')
    .upsert({
      ...data,
      entreprise_id,
      salaire_jour
    }, {
      onConflict: 'ouvrier_id,date'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting pointage:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/pointage');
  return { pointage };
}

/**
 * Pointage rapide via QR Code
 */
export async function pointageRapideQR(ouvrier_id: string, chantier_id: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  // 1. Récupérer d'abord les infos de l'ouvrier pour pouvoir les retourner même si déjà pointé
  const { data: ouvrier } = await supabase
    .from('ouvriers')
    .select('nom_complet, taux_journalier')
    .eq('id', ouvrier_id)
    .single();

  if (!ouvrier) return { error: "Ouvrier non trouvé" };

  // 2. Vérifier si déjà pointé
  const { data: existing } = await supabase
    .from('pointages')
    .select('id, heure_arrivee')
    .eq('ouvrier_id', ouvrier_id)
    .eq('date', today)
    .single();

  if (existing) {
    return {
      alreadyPointed: true,
      ouvrier: { nom_complet: ouvrier.nom_complet },
      heure_arrivee: existing.heure_arrivee
    };
  }

  // 3. Créer pointage présent
  const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const { error } = await supabase
    .from('pointages')
    .insert({
      entreprise_id,
      chantier_id,
      ouvrier_id,
      date: today,
      statut: 'present',
      heure_arrivee: nowTime,
      salaire_jour: ouvrier.taux_journalier || 0
    });

  if (error) return { error: error.message };

  revalidatePath('/dashboard/pointage');
  return {
    success: true,
    ouvrier: { nom_complet: ouvrier.nom_complet },
    heure_arrivee: nowTime
  };
}

/**
 * Statistiques de pointage pour un mois donné
 */
export async function getPointagesStats(chantier_id: string, mois: number, annee: number) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const startDate = new Date(annee, mois - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(annee, mois, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('pointages')
    .select(`
      statut,
      salaire_jour,
      ouvrier_id,
      ouvrier:ouvriers(nom_complet, metier, taux_journalier)
    `)
    .eq('entreprise_id', entreprise_id)
    .eq('chantier_id', chantier_id)
    .gte('date', startDate)
    .lte('date', endDate);

  if (error) return { error: error.message };

  const statsMap = new Map<string, PointageStats>();

  data.forEach((p: any) => {
    const oid = p.ouvrier_id;
    if (!statsMap.has(oid)) {
      statsMap.set(oid, {
        ouvrier_id: oid,
        nom_complet: p.ouvrier.nom_complet,
        metier: p.ouvrier.metier,
        taux_journalier: p.ouvrier.taux_journalier,
        jours_present: 0,
        jours_absent: 0,
        demi_journees: 0,
        total_salaire: 0
      });
    }

    const s = statsMap.get(oid)!;
    if (p.statut === 'present') s.jours_present++;
    else if (p.statut === 'absent') s.jours_absent++;
    else if (p.statut === 'demi_journee') s.demi_journees++;

    s.total_salaire += Number(p.salaire_jour || 0);
  });

  return { stats: Array.from(statsMap.values()) };
}

/**
 * Initialise la journée en mettant tous les ouvriers du chantier en 'absent'
 * s'ils n'ont pas encore de pointage pour ce jour.
 */
export async function initPointageJour(chantier_id: string, date: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  // 1. Ouvriers du chantier
  const { data: workers } = await supabase
    .from('ouvriers')
    .select('id')
    .contains('chantier_ids', [chantier_id])
    .eq('entreprise_id', entreprise_id);

  if (!workers || workers.length === 0) return { success: true, count: 0 };

  // 2. Pointages existants
  const { data: existing } = await supabase
    .from('pointages')
    .select('ouvrier_id')
    .eq('chantier_id', chantier_id)
    .eq('date', date);

  const existingIds = new Set(existing?.map(e => e.ouvrier_id) || []);

  // 3. Préparer les inserts
  const toInsert = workers
    .filter(w => !existingIds.has(w.id))
    .map(w => ({
      entreprise_id,
      chantier_id,
      ouvrier_id: w.id,
      date,
      statut: 'absent',
      salaire_jour: 0
    }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from('pointages').insert(toInsert);
    if (error) return { error: error.message };
  }

  revalidatePath('/dashboard/pointage');
  return { success: true, count: toInsert.length };
}
