'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getExpenses(chantierId?: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  let query = supabase
    .from('depenses')
    .select('*')
    .eq('entreprise_id', entreprise_id)
    .order('date', { ascending: false });
  if (chantierId && chantierId !== 'all') query = query.eq('chantier_id', chantierId);

  const { data: expenses, error } = await query;

  if (error) {
    console.error('Error fetching expenses:', error);
    return { error: error.message };
  }

  return { expenses };
}

export async function addExpense(data: any) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: expense, error } = await supabase
    .from('depenses')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single();

  if (error) {
    console.error('Error adding expense:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/budget');
  return { expense };
}
