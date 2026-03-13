'use server'

import { createClient } from '@/lib/supabase/server'

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
