'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getProjects() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return { error: error.message };
  }

  return { projects };
}

export async function createProject(data: any) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('chantiers')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/chantiers');
  return { project };
}

/**
 * Un chantier a des cascades sur presque toutes les tables (pointages,
 * dépenses, matériaux, mouvements de stock, paiements, phases). On
 * n'autorise la suppression physique que si aucun pointage ni dépense
 * n'a jamais été enregistré dessus (chantier créé par erreur, jamais
 * réellement démarré). Sinon on suggère de le marquer "Terminé" plutôt
 * que de détruire l'historique.
 */
export async function deleteProject(projectId: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const [{ count: pointagesCount }, { count: depensesCount }] = await Promise.all([
    supabase.from('pointages').select('id', { count: 'exact', head: true }).eq('chantier_id', projectId),
    supabase.from('depenses').select('id', { count: 'exact', head: true }).eq('chantier_id', projectId),
  ]);

  if ((pointagesCount && pointagesCount > 0) || (depensesCount && depensesCount > 0)) {
    return {
      error: "Ce chantier a un historique de pointage ou de dépenses et ne peut pas être supprimé. Marquez-le plutôt comme \"Terminé\".",
    };
  }

  const { error } = await supabase
    .from('chantiers')
    .delete()
    .eq('id', projectId)
    .eq('entreprise_id', entreprise_id);

  if (error) {
    console.error('Error deleting project:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/chantiers');
  return { success: true };
}

export async function updateProjectStatus(projectId: string, status: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { error } = await supabase
    .from('chantiers')
    .update({ statut: status })
    .eq('id', projectId)
    .eq('entreprise_id', entreprise_id);

  if (error) {
    console.error('Error updating project status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/chantiers');
  return { success: true };
}

export async function updateProjectProgress(projectId: string, progress: number) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { error } = await supabase
    .from('chantiers')
    .update({ avancement_pct: progress })
    .eq('id', projectId)
    .eq('entreprise_id', entreprise_id);

  if (error) {
    console.error('Error updating project progress:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/chantiers');
  return { success: true };
}

export async function getProjectById(id: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('id', id)
    .eq('entreprise_id', entreprise_id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return { error: error.message };
  }

  return { project };
}

export async function getProjectActivity(projectId: string, limit: number = 20) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  // Fetch expenses and stock movements for this project
  const [expensesRes, movementsRes] = await Promise.all([
    supabase
      .from('depenses')
      .select('id, libelle, montant, date_operation, created_at, categorie')
      .eq('chantier_id', projectId)
      .eq('entreprise_id', entreprise_id)
      .order('date_operation', { ascending: false })
      .limit(limit),
    supabase
      .from('mouvements_stock')
      .select('id, type_mouvement, quantite, date_operation, created_at, materiaux(nom, unite)')
      .eq('chantier_id', projectId)
      .eq('entreprise_id', entreprise_id)
      .order('date_operation', { ascending: false })
      .limit(limit)
  ]);

  const activities: any[] = [];

  if (expensesRes.data) {
    expensesRes.data.forEach(e => {
      activities.push({
        id: e.id,
        type: 'expense',
        title: e.libelle,
        amount: e.montant,
        date: e.date_operation,
        created_at: e.created_at,
        categorie: e.categorie
      });
    });
  }

  if (movementsRes.data) {
    movementsRes.data.forEach((m: any) => {
      activities.push({
        id: m.id,
        type: 'stock',
        title: `${m.type_mouvement === 'entree' ? 'Réapprovisionnement' : 'Consommation'} ${m.materiaux?.nom}`,
        amount: m.quantite,
        unit: m.materiaux?.unite,
        date: m.date_operation,
        created_at: m.created_at,
        subType: m.type_mouvement
      });
    });
  }

  // Sort by date descending
  activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { activities: activities.slice(0, limit) };
}
