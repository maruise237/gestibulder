'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NewMaterial, NewStockMovement } from '@/types/stock';
import { getAuthenticatedEnterpriseId } from './utils';
import { notifyEnterprise } from './notification.actions';

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

/**
 * Empêche la suppression physique d'un matériau qui a déjà des mouvements
 * de stock enregistrés (entrées/sorties) : ça effacerait leur historique
 * financier (coûts, fournisseurs). Un matériau jamais utilisé peut être
 * supprimé sans risque.
 */
export async function deleteMaterial(id: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { count } = await supabase
    .from('mouvements_stock')
    .select('id', { count: 'exact', head: true })
    .eq('materiau_id', id);

  if (count && count > 0) {
    return {
      error: "Ce matériau a des mouvements de stock enregistrés et ne peut pas être supprimé, pour préserver l'historique financier.",
    };
  }

  const { error } = await supabase
    .from('materiaux')
    .delete()
    .eq('id', id)
    .eq('entreprise_id', entreprise_id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/stocks');
  return { success: true };
}

export async function addStockMovement(data: NewStockMovement) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // On a besoin des infos du matériau à la fois pour la validation (sortie)
  // et pour savoir, après le mouvement, si le seuil d'alerte est franchi.
  const { data: materialWithStock } = await supabase
    .from('materiaux_avec_stock')
    .select('nom, stock_actuel, seuil_alerte, unite')
    .eq('id', data.materiau_id)
    .single();

  // Empêcher une sortie de stock supérieure à la quantité disponible.
  // Validation faite côté serveur car le client ne doit jamais être la
  // seule barrière (formulaire, extension, appel API direct, etc.)
  if (data.type_mouvement === 'sortie') {
    if (!materialWithStock) {
      return { error: "Matériau introuvable" };
    }

    if (data.quantite > (materialWithStock.stock_actuel || 0)) {
      return {
        error: `Stock insuffisant : ${materialWithStock.stock_actuel} ${materialWithStock.unite} disponible(s) pour "${materialWithStock.nom}", impossible de sortir ${data.quantite}.`,
      };
    }
  }

  const { data: movement, error } = await supabase
    .from('mouvements_stock')
    .insert([{ ...data, entreprise_id, saisi_par: user?.id }])
    .select()
    .single();

  if (error) return { error: error.message };

  // Une entrée de stock avec un coût unitaire renseigné représente un achat
  // réel : il doit se répercuter dans les dépenses du chantier, sinon le
  // budget consommé/restant ne reflète jamais le coût des matériaux achetés.
  if (data.type_mouvement === 'entree' && data.cout_unitaire && data.cout_unitaire > 0) {
    const montantTotal = data.cout_unitaire * data.quantite;
    const nomMateriau = materialWithStock?.nom || 'Matériau';
    await supabase.from('depenses').insert([{
      entreprise_id,
      chantier_id: data.chantier_id,
      libelle: `Achat ${nomMateriau} (${data.quantite} ${materialWithStock?.unite || ''})`,
      montant: montantTotal,
      categorie: 'materiaux',
      date_operation: data.date_operation || new Date().toISOString(),
      saisi_par: user?.id,
    }]);
    revalidatePath('/dashboard/budget');
    revalidatePath(`/dashboard/chantiers/${data.chantier_id}`);
  }

  // Alerte stock critique : uniquement si une sortie vient de faire passer
  // le stock sous (ou à) son seuil d'alerte alors qu'il était au-dessus
  // avant ce mouvement (pour ne notifier qu'une seule fois au franchissement,
  // pas à chaque sortie tant qu'on reste sous le seuil).
  if (data.type_mouvement === 'sortie' && materialWithStock) {
    const stockAvant = materialWithStock.stock_actuel || 0;
    const stockApres = stockAvant - data.quantite;
    const seuil = materialWithStock.seuil_alerte || 0;

    if (stockAvant > seuil && stockApres <= seuil) {
      const titre = stockApres <= 0 ? 'Rupture de stock' : 'Stock critique';
      const message = `"${materialWithStock.nom}" : il reste ${stockApres} ${materialWithStock.unite}${stockApres > 0 ? ` (seuil : ${seuil})` : ''}.`;
      notifyEnterprise(entreprise_id, titre, message).catch(() => {});
    }
  }

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
