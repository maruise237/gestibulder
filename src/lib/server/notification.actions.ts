'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getNotifications() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { notifications: [] }

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('destinataire_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message }
  return { notifications: data }
}

export async function markAsRead(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non autorisé' }

  const { error } = await supabase
    .from('notifications')
    .update({ lu: true })
    .eq('destinataire_id', user.id)
    .eq('lu', false)
  if (error) return { error: error.message }
  return { success: true }
}

/**
 * Crée une notification pour chaque membre actif d'une entreprise.
 * Utilisé en interne par les autres server actions (ex: alerte de stock
 * critique) — pas un endpoint appelé directement depuis le client.
 */
export async function notifyEnterprise(entrepriseId: string, titre: string, message?: string) {
  const admin = createAdminClient();
  if (!admin) return;

  const { data: profiles, error: profilesError } = await admin
    .from('profiles')
    .select('id')
    .eq('entreprise_id', entrepriseId)
    .eq('actif', true);

  if (profilesError || !profiles || profiles.length === 0) return;

  const rows = profiles.map((p) => ({
    entreprise_id: entrepriseId,
    destinataire_id: p.id,
    titre,
    message,
  }));

  await admin.from('notifications').insert(rows);
}
