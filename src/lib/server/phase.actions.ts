'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedEnterpriseId } from './utils'

export async function getPhases(chantierId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('phases_chantier')
    .select('*')
    .eq('chantier_id', chantierId)
    .order('ordre', { ascending: true })
  if (error) return { error: error.message }
  return { phases: data }
}

export async function createPhase(data: {
  chantier_id: string
  nom: string
  description?: string
  date_debut?: string
  date_fin_prevue?: string
  ordre?: number
  couleur?: string
}) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId()
  if (authError) return { error: authError }

  const supabase = await createClient()
  const { data: phase, error } = await supabase
    .from('phases_chantier')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/planning')
  return { phase }
}

export async function updatePhase(id: string, data: Partial<{
  nom: string
  statut: string
  avancement_pct: number
  date_fin_reelle: string
  responsable_id: string
}>) {
  const supabase = await createClient()
  const { data: phase, error } = await supabase
    .from('phases_chantier')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) return { error: error.message }
  revalidatePath('/dashboard/planning')
  return { phase }
}

export async function deletePhase(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('phases_chantier')
    .delete()
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/planning')
  return { success: true }
}
