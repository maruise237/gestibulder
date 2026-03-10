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

export async function getWorkersByProject(projectId: string) {
  const supabase = await createClient();

  const { data: workers, error } = await supabase
    .from('ouvriers')
    .select('*')
    .contains('chantier_ids', [projectId])
    .order('nom_complet', { ascending: true });

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
  const supabase = await createClient();

  const { data: worker, error } = await supabase
    .from('ouvriers')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating worker:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/ouvriers');
  return { worker };
}
