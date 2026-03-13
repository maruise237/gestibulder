'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getWorkerPayments(workerId: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('paiements')
    .select('*')
    .eq('ouvrier_id', workerId)
    .eq('entreprise_id', entreprise_id)
    .order('date_paiement', { ascending: false });

  if (error) return { error: error.message };
  return { payments: data };
}

export async function createPayment(data: any) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: payment, error } = await supabase
    .from('paiements')
    .insert([{ ...data, entreprise_id, saisi_par: user?.id }])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard/ouvriers');
  return { payment };
}

export async function getWorkerSalariesDue(workerId: string, projectId: string) {
    const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
    if (authError) return { error: authError };

    const supabase = await createClient();

    // 1. Get worker info
    const { data: worker } = await supabase.from('ouvriers').select('*').eq('id', workerId).single();
    if (!worker) return { error: 'Ouvrier introuvable' };

    // 2. Get attendance logs for this worker on this project
    const { data: logs } = await supabase
        .from('pointages')
        .select('*')
        .eq('ouvrier_id', workerId)
        .eq('chantier_id', projectId)
        .eq('statut', 'present');

    // 3. Get total already paid
    const { data: payments } = await supabase
        .from('paiements')
        .select('montant')
        .eq('ouvrier_id', workerId)
        .eq('chantier_id', projectId);

    const totalPaid = payments?.reduce((sum, p) => sum + p.montant, 0) || 0;

    let totalDue = 0;
    if (worker.type_paiement === 'journalier') {
        totalDue = (logs?.length || 0) * (worker.taux_journalier || 0);
    } else if (worker.type_paiement === 'production') {
        totalDue = logs?.reduce((sum, l) => sum + (l.quantite_produite * (worker.taux_journalier || 0)), 0) || 0;
    }

    return {
        totalDue,
        totalPaid,
        remaining: totalDue - totalPaid,
        daysPresent: logs?.length || 0
    };
}
