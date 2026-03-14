'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NewMaterial, NewStockMovement } from '@/types/stock';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getMaterials(chantierId: string) {
  const supabase = await createClient();

  const { data: materials, error: matError } = await supabase
    .from('materiaux_avec_stock')
    .select('*')
    .eq('chantier_id', chantierId)
    .order('nom', { ascending: true });

  if (matError) return { error: matError.message };

  return { materials: materials || [] };
}

export async function getAllMaterials() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: materials, error } = await supabase
    .from('materiaux')
    .select('*')
    .eq('entreprise_id', entreprise_id)
    .order('nom', { ascending: true });

  if (error) return { error: error.message };
  return { materials };
}

export async function createMaterial(data: NewMaterial) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: material, error } = await supabase
    .from('materiaux')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard/stocks');
  return { material };
}

export async function addStockMovement(data: NewStockMovement) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: movement, error } = await supabase
    .from('mouvements_stock')
    .insert([{ ...data, entreprise_id, saisi_par: user?.id }])
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard/stocks');
  return { movement };
}

export async function getAllStockAlerts() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data: alerts, error } = await supabase
    .from('materiaux_avec_stock')
    .select('id, nom, seuil_alerte, stock_actuel, statut_stock')
    .eq('entreprise_id', entreprise_id)
    .in('statut_stock', ['critique', 'rupture']);

  if (error) return { error: error.message };
  return { alerts: alerts || [] };
}

export async function getRecentStockMovements(limit = 5) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mouvements_stock')
    .select(
      `
            *,
            materiaux (nom, unite),
            chantiers (nom)
        `
    )
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return { error: error.message };
  return { movements: data };
}

export async function getMaterialHistory(materialId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('mouvements_stock')
    .select('*')
    .eq('materiau_id', materialId)
    .order('date_operation', { ascending: false });

  if (error) return { error: error.message };
  return { history: data };
}
