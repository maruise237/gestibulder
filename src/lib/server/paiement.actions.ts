'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedEnterpriseId } from './utils'

export async function getPaiements(chantierId?: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId()
  if (authError) return { error: authError }

  const supabase = await createClient()
  let query = supabase
    .from('paiements_ouvriers')
    .select(`
      *,
      ouvriers(nom_complet, metier, type_paiement)
    `)
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false })

  if (chantierId) query = query.eq('chantier_id', chantierId)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { paiements: data }
}

export async function getWorkerPayments(workerId: string, projectId: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('paiements_ouvriers')
    .select('*')
    .eq('ouvrier_id', workerId)
    .eq('chantier_id', projectId)
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { payments: data };
}

export async function getWorkerSalariesDue(workerId: string, projectId: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { totalDue: 0, totalPaid: 0, remaining: 0, daysPresent: 0 };

  const supabase = await createClient();

  const [logsRes, paymentsRes] = await Promise.all([
    supabase.from('pointages').select('quantite_produite, salaire_jour')
      .eq('ouvrier_id', workerId)
      .eq('chantier_id', projectId)
      .eq('statut', 'present'),
    supabase.from('paiements_ouvriers').select('montant_paye')
      .eq('ouvrier_id', workerId)
      .eq('chantier_id', projectId)
      .eq('entreprise_id', entreprise_id),
  ]);

  const logs = logsRes.data || [];
  const payments = paymentsRes.data || [];

  const totalDue = logs.reduce((sum, l) => sum + (Number(l.salaire_jour) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.montant_paye) || 0), 0);

  return {
    totalDue,
    totalPaid,
    remaining: Math.max(0, totalDue - totalPaid),
    daysPresent: logs.length,
  };
}

export async function createPayment(data: {
  ouvrier_id: string;
  chantier_id: string;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
}) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: payment, error } = await supabase
    .from('paiements_ouvriers')
    .insert([{
      entreprise_id,
      chantier_id: data.chantier_id,
      ouvrier_id: data.ouvrier_id,
      periode_debut: new Date().toISOString().split('T')[0],
      periode_fin: new Date().toISOString().split('T')[0],
      montant_calcule: data.montant,
      montant_paye: data.montant,
      statut: 'paye',
      date_paiement: data.date_paiement.split('T')[0],
      mode_paiement: data.mode_paiement,
      saisi_par: user?.id,
    }])
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath('/dashboard/ouvriers');
  return { payment };
}

export async function calculerEtCreerPaiement(
  ouvrierId: string,
  chantierId: string,
  periodDebut: string,
  periodFin: string
) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId()
  if (authError) return { error: authError }

  const supabase = await createClient()

  const { data: calcul, error: calcError } = await supabase
    .rpc('calculer_paiement_ouvrier', {
      p_ouvrier_id: ouvrierId,
      p_chantier_id: chantierId,
      p_debut: periodDebut,
      p_fin: periodFin,
    })

  if (calcError) return { error: calcError.message }
  if (!calcul || (calcul as any[]).length === 0) return { error: 'Aucune donnée calculée' }

  const result = (calcul as any)[0]

  const { data: paiement, error } = await supabase
    .from('paiements_ouvriers')
    .insert([{
      entreprise_id,
      chantier_id: chantierId,
      ouvrier_id: ouvrierId,
      periode_debut: periodDebut,
      periode_fin: periodFin,
      jours_travailles: result.jours_travailles,
      jours_absents: result.jours_absents,
      montant_calcule: result.montant_calcule,
      montant_paye: 0,
      statut: 'en_attente',
    }])
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/paiements')
  return { paiement }
}

export async function enregistrerPaiement(
  id: string,
  montantPaye: number,
  modePaiement: string
) {
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('paiements_ouvriers')
    .select('montant_calcule, montant_paye')
    .eq('id', id)
    .single()

  if (!current) return { error: 'Paiement introuvable' }

  const totalPaye = (current.montant_paye || 0) + montantPaye
  const statut = totalPaye >= current.montant_calcule
    ? 'paye'
    : totalPaye > 0
    ? 'partiel'
    : 'en_attente'

  const { data, error } = await supabase
    .from('paiements_ouvriers')
    .update({
      montant_paye: totalPaye,
      statut,
      date_paiement: statut === 'paye' ? new Date().toISOString().split('T')[0] : null,
      mode_paiement: modePaiement,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/paiements')
  return { paiement: data }
}
