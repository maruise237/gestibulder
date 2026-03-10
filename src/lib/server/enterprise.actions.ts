'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

import { cache } from 'react';

export const getEnterprise = cache(async () => {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: enterprise, error } = await supabase
    .from('entreprises')
    .select('*')
    .eq('id', entreprise_id)
    .single();

  if (error) return { error: error.message };
  return { enterprise };
});

export async function updateEnterprise(data: {
  nom?: string;
  pays?: string;
  devise?: string;
  logo_url?: string;
}) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { error } = await supabase.from('entreprises').update(data).eq('id', entreprise_id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}

export const getUserProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autorisé' };

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return { error: error.message };
  return { profile };
});

export async function updateUserProfile(data: { nom_complet?: string; telephone?: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non autorisé' };

  const { error } = await supabase.from('profiles').update(data).eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}
