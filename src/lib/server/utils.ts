'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cache } from 'react';

/**
 * Récupère l'entreprise_id de l'utilisateur actuel avec réparation automatique du profil si nécessaire.
 * Utile pour les comptes créés avant la mise en place des triggers ou en cas de désynchronisation.
 * Cette fonction est mise en cache pour la durée d'une même requête serveur.
 */
export const getAuthenticatedEnterpriseId = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Non autorisé' };

  // 1. Essayer de récupérer le profil
  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('entreprise_id')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error('[Auto-Repair] Error fetching profile:', profileError);
  }

  // 2. Si le profil est absent, tenter une réparation automatique
  if (!profile) {
    console.warn(
      `[Auto-Repair] Profil manquant pour l'utilisateur ${user.id}. Tentative de restauration...`
    );

    const admin = createAdminClient();

    if (!admin) {
      console.error('[Auto-Repair] Admin client not available. Check SUPABASE_SERVICE_ROLE_KEY.');
      return {
        error:
          "Impossible de réparer le profil : Clé d'administration manquante (SUPABASE_SERVICE_ROLE_KEY).",
      };
    }

    // Vérifier si une entreprise existe déjà avec l'ID de l'utilisateur (standard admin)
    const { data: existingEnt } = await admin
      .from('entreprises')
      .select('id')
      .eq('id', user.id)
      .single();

    let targetEntId = existingEnt?.id;

    if (!targetEntId) {
      // Créer l'entreprise si elle manque aussi
      const { data: newEnt, error: entError } = await admin
        .from('entreprises')
        .insert([
          {
            id: user.id,
            admin_id: user.id,
            nom: user.user_metadata?.enterprise_name || 'Ma Nouvelle Entreprise',
            pays: 'Algérie', // Valeur par défaut pour éviter les erreurs de contrainte NOT NULL
            devise: 'DZD',
          },
        ])
        .select()
        .single();

      if (entError) {
        console.error('[Auto-Repair] Error creating enterprise:', entError);
        return {
          error: `Échec de réparation : Impossible de créer l'entreprise. (${entError.message})`,
        };
      }
      targetEntId = newEnt.id;
    }

    // Créer le profil manquant
    const { data: newProfile, error: createProfileError } = await admin
      .from('profiles')
      .insert([
        {
          id: user.id,
          entreprise_id: targetEntId,
          nom_complet: user.user_metadata?.nom_complet || 'Administrateur',
          role: 'admin',
        },
      ])
      .select()
      .single();

    if (createProfileError) {
      console.error('[Auto-Repair] Error creating profile:', createProfileError);
      return {
        error: `Échec de réparation : Impossible de recréer le profil. (${createProfileError.message})`,
      };
    }
    profile = newProfile;
  }

  if (!profile) return { error: "Profil introuvable après réparation" };
  return { entreprise_id: profile.entreprise_id };
});
