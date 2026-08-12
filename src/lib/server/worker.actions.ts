'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getWorkers(page: number = 1, pageSize: number = 10) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data: workers,
    error,
    count,
  } = await supabase
    .from('ouvriers')
    .select('*', { count: 'exact' })
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('Error fetching workers:', error);
    return { error: error.message };
  }

  return {
    workers,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

export async function getWorkersByProject(projectId: string, activeOnly: boolean = false) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  let query = supabase
    .from('ouvriers')
    .select('*')
    .eq('entreprise_id', entreprise_id)
    .contains('chantier_ids', [projectId])
    .order('nom_complet', { ascending: true });

  if (activeOnly) query = query.eq('actif', true);

  const { data: workers, error } = await query;

  if (error) {
    console.error('Error fetching workers by project:', error);
    return { error: error.message };
  }

  return { workers };
}

export async function createWorker(data: any) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: worker, error } = await supabase
    .from('ouvriers')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating worker:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/ouvriers');
  return { worker };
}

export async function updateWorker(id: string, data: any) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: worker, error } = await supabase
    .from('ouvriers')
    .update(data)
    .eq('id', id)
    .eq('entreprise_id', entreprise_id)
    .select()
    .single();

  if (error) {
    console.error('Error updating worker:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/ouvriers');
  return { worker };
}

/**
 * "Supprime" un ouvrier : en réalité une désactivation (actif = false), pas
 * une suppression physique. Un hard delete entraînerait la suppression en
 * cascade (ON DELETE CASCADE) de tout son historique de pointage et de
 * paiement, ce qui est inacceptable pour la comptabilité et les litiges
 * éventuels sur des salaires déjà versés. L'ouvrier désactivé n'apparaît
 * plus dans les listes de pointage mais reste visible dans l'effectif avec
 * le badge "Inactif", et son historique reste intact.
 */
export async function deleteWorker(id: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from('ouvriers')
    .update({ actif: false })
    .eq('id', id)
    .eq('entreprise_id', entreprise_id);

  if (error) {
    console.error('Error deactivating worker:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/ouvriers');
  revalidatePath('/dashboard/pointage');
  return { success: true };
}

export async function reactivateWorker(id: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase
    .from('ouvriers')
    .update({ actif: true })
    .eq('id', id)
    .eq('entreprise_id', entreprise_id);

  if (error) {
    console.error('Error reactivating worker:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/ouvriers');
  revalidatePath('/dashboard/pointage');
  return { success: true };
}
