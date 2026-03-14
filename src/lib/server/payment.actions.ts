'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getWorkerPayments(workerId: string, projectId: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('paiements_ouvriers') // ← table correcte
    .select('*')
    .eq('ouvrier_id', workerId)
    .eq('chantier_id', projectId)
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message };
  return { payments: data };
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

  // Récupérer ou créer la fiche paiement pour cette période
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

  // Utilise salaire_jour calculé au moment du pointage (plus précis)
  const totalDue = logs.reduce((sum, l) => sum + (Number(l.salaire_jour) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.montant_paye) || 0), 0);

  return {
    totalDue,
    totalPaid,
    remaining: Math.max(0, totalDue - totalPaid),
    daysPresent: logs.length,
  };
}
