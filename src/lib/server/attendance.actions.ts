'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NewAttendance } from '@/types/attendance';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getAttendance(chantierId?: string, date?: string) {
  const supabase = await createClient();

  let query = supabase.from('pointages').select('*').order('date', { ascending: false });
  if (chantierId) query = query.eq('chantier_id', chantierId);
  if (date) query = query.eq('date', date);

  const { data: logs, error } = await query;

  if (error) {
    console.error('Error fetching attendance:', error);
    return { error: error.message };
  }

  return { logs };
}

export async function logAttendance(data: NewAttendance) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Fetch worker salary details
  const { data: worker } = await supabase
    .from('ouvriers')
    .select('taux_journalier, salaire_hebdo, salaire_mensuel, type_paiement')
    .eq('id', data.ouvrier_id)
    .single();

  if (!worker) return { error: 'Ouvrier non trouvé' };

  // 2. Calculate daily salary if present
  let salaire_jour = 0;
  if (data.statut === 'present') {
    if (worker.type_paiement === 'journalier') {
      salaire_jour = Number(worker.taux_journalier) || 0;
    } else if (worker.type_paiement === 'hebdomadaire') {
      salaire_jour = (Number(worker.salaire_hebdo) || 0) / 6;
    } else if (worker.type_paiement === 'mensuel') {
      salaire_jour = (Number(worker.salaire_mensuel) || 0) / 26;
    }
  }

  // 3. Upsert with explicit onConflict for Supabase
  const { data: log, error } = await supabase
    .from('pointages')
    .upsert(
      {
        ...data,
        entreprise_id,
        saisi_par: user?.id,
        salaire_jour,
      },
      {
        onConflict: 'ouvrier_id,date',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error logging attendance:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/pointage');
  return { log };
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('pointages').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/pointage');
  return { success: true };
}
