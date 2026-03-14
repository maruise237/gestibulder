'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedEnterpriseId } from './utils';
import { getEnterprise } from './enterprise.actions';

export async function getDashboardData() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { projects: [], workers: [], workersCount: 0, expenses: [], alerts: [], movements: [], enterprise: null, error: authError };

  const supabase = await createClient();

  // On lance toutes les requêtes en parallèle sur le serveur
  const [projectsRes, workersRes, expensesRes, alertsRes, movementsRes, enterpriseRes] =
    await Promise.all([
      supabase
        .from('chantiers')
        .select('*')
        .order('created_at', { ascending: false })
        .eq('entreprise_id', entreprise_id),
      supabase
        .from('ouvriers')
        .select('*', { count: 'exact', head: false })
        .eq('entreprise_id', entreprise_id),
      supabase.from('depenses').select('montant').eq('entreprise_id', entreprise_id),
      supabase
        .from('materiaux_avec_stock')
        .select('id, nom, statut_stock')
        .eq('entreprise_id', entreprise_id)
        .in('statut_stock', ['critique', 'rupture']),
      supabase
        .from('mouvements_stock')
        .select('*, materiaux(nom)')
        .eq('entreprise_id', entreprise_id)
        .order('date_operation', { ascending: false })
        .limit(5),
      getEnterprise(),
    ]);

  return {
    projects: projectsRes.data || [],
    workersCount: workersRes.count || 0,
    workers: workersRes.data || [],
    expenses: expensesRes.data || [],
    alerts: alertsRes.data || [],
    movements: movementsRes.data || [],
    enterprise: enterpriseRes.enterprise || null,
    error:
      projectsRes.error?.message || workersRes.error?.message || expensesRes.error?.message || null,
  };
}

export async function getBudgetData() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { projects: [], workers: [], workersCount: 0, expenses: [], alerts: [], movements: [], enterprise: null, error: authError };

  const supabase = await createClient();

  const [projectsRes, expensesRes, enterpriseRes] = await Promise.all([
    supabase
      .from('chantiers')
      .select('*')
      .eq('entreprise_id', entreprise_id)
      .order('nom', { ascending: true }),
    supabase
      .from('depenses')
      .select('*')
      .eq('entreprise_id', entreprise_id)
      .order('date_operation', { ascending: false }),
    getEnterprise(),
  ]);

  return {
    projects: projectsRes.data || [],
    expenses: expensesRes.data || [],
    enterprise: enterpriseRes.enterprise || null,
    error: projectsRes.error?.message || expensesRes.error?.message || null,
  };
}
