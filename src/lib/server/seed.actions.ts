'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function seedDemoData(projectId: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  // 1. Seed Workers
  const demoWorkers = [
    {
      nom_complet: 'Jean Dupont',
      metier: 'Chef de chantier',
      type_paiement: 'mensuel',
      salaire_mensuel: 45000,
      chantier_ids: [projectId],
      entreprise_id,
      actif: true
    },
    {
      nom_complet: 'Marc Perrin',
      metier: 'Maçon',
      type_paiement: 'journalier',
      taux_journalier: 2500,
      chantier_ids: [projectId],
      entreprise_id,
      actif: true
    }
  ];

  await supabase.from('ouvriers').insert(demoWorkers);

  // 2. Seed Materials
  const demoMaterials = [
    {
      nom: 'Ciment Portland',
      unite: 'Sacs',
      seuil_alerte: 10,
      chantier_id: projectId,
      entreprise_id
    },
    {
      nom: 'Briques 12 trous',
      unite: 'Unités',
      seuil_alerte: 100,
      chantier_id: projectId,
      entreprise_id
    }
  ];

  const { data: materials } = await supabase.from('materiaux').insert(demoMaterials).select();

  // 3. Seed Stock Movements
  if (materials) {
    const movements = materials.map(m => ({
      materiau_id: m.id,
      chantier_id: projectId,
      entreprise_id,
      type_mouvement: 'entree',
      quantite: m.nom.includes('Ciment') ? 50 : 500,
      date: new Date().toISOString()
    }));
    await supabase.from('mouvements_stock').insert(movements);
  }

  // 4. Seed Expenses
  const demoExpenses = [
    {
      libelle: 'Location pelleteuse',
      montant: 15000,
      categorie: 'divers',
      date: new Date().toISOString(),
      chantier_id: projectId,
      entreprise_id
    },
    {
      libelle: 'Achat outillage main',
      montant: 5000,
      categorie: 'divers',
      date: new Date().toISOString(),
      chantier_id: projectId,
      entreprise_id
    }
  ];

  await supabase.from('depenses').insert(demoExpenses);

  revalidatePath('/dashboard');
  return { success: true };
}
