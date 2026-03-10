'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedEnterpriseId } from './utils';
import { getEnterprise } from './enterprise.actions';

export async function getDashboardData() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError)
    return {
      projects: [],
      workersCount: 0,
      workers: [],
      expenses: [],
      alerts: [],
      movements: [],
      enterprise: null,
      error: authError,
    };

  const supabase = await createClient();

  // On lance toutes les requêtes en parallèle sur le serveur
  // C'est beaucoup plus rapide que de faire 6 appels séparés depuis le client
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
      supabase.from('depenses').select('montant, categorie').eq('entreprise_id', entreprise_id),
      supabase.from('materiaux').select('id, nom, seuil_alerte').eq('entreprise_id', entreprise_id),
      supabase
        .from('mouvements_stock')
        .select('*, materiaux(nom)')
        .eq('entreprise_id', entreprise_id)
        .order('date', { ascending: false })
        .limit(5),
      getEnterprise(),
    ]);

  // Calcul des alertes stock sur le serveur
  // On a besoin des mouvements pour calculer le stock actuel
  const { data: movementsForAlerts } = await supabase
    .from('mouvements_stock')
    .select('materiau_id, type_mouvement, quantite')
    .eq('entreprise_id', entreprise_id);

  const alerts = (alertsRes.data || []).filter((mat) => {
    const matMovements = (movementsForAlerts || []).filter((m) => m.materiau_id === mat.id);
    const stock_actuel = matMovements.reduce((acc, m) => {
      return m.type_mouvement === 'entree' ? acc + Number(m.quantite) : acc - Number(m.quantite);
    }, 0);
    return stock_actuel <= mat.seuil_alerte;
  });

  return {
    projects: projectsRes.data || [],
    workersCount: workersRes.count || 0,
    workers: workersRes.data || [],
    expenses: expensesRes.data || [],
    alerts: alerts,
    movements: movementsRes.data || [],
    enterprise: enterpriseRes.enterprise || null,
    error:
      projectsRes.error?.message || workersRes.error?.message || expensesRes.error?.message || null,
  };
}

export async function getBudgetData() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

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
      .order('date', { ascending: false }),
    getEnterprise(),
  ]);

  return {
    projects: projectsRes.data || [],
    expenses: expensesRes.data || [],
    enterprise: enterpriseRes.enterprise || null,
    error: projectsRes.error?.message || expensesRes.error?.message || null,
  };
}
