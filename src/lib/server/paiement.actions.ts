'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedEnterpriseId } from './utils'

export async function getPaiements(chantierId?: string) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId()
  if (authError) return { error: authError }

  const supabase = await createClient()
  let query = supabase
    .from('paiements_ouvriers')
    .select(`
      *,
      ouvriers(nom_complet, metier, type_paiement)
    `)
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false })

  if (chantierId) query = query.eq('chantier_id', chantierId)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { paiements: data }
}

export async function calculerEtCreerPaiement(
  ouvrierId: string,
  chantierId: string,
  periodDebut: string,
  periodFin: string
) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId()
  if (authError) return { error: authError }

  const supabase = await createClient()

  // Appel à la fonction PostgreSQL
  const { data: calcul, error: calcError } = await supabase
    .rpc('calculer_paiement_ouvrier', {
      p_ouvrier_id: ouvrierId,
      p_chantier_id: chantierId,
      p_debut: periodDebut,
      p_fin: periodFin,
    })

  if (calcError) return { error: calcError.message }

  const result = (calcul as any)[0]

  // Créer la fiche de paiement
  const { data: paiement, error } = await supabase
    .from('paiements_ouvriers')
    .insert([{
      entreprise_id,
      chantier_id: chantierId,
      ouvrier_id: ouvrierId,
      periode_debut: periodDebut,
      periode_fin: periodFin,
      jours_travailles: result.jours_travailles,
      jours_absents: result.jours_absents,
      montant_calcule: result.montant_calcule,
      montant_paye: 0,
      statut: 'en_attente',
    }])
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/paiements')
  return { paiement }
}

export async function enregistrerPaiement(
  id: string,
  montantPaye: number,
  modePaiement: string
) {
  const supabase = await createClient()

  const { data: current } = await supabase
    .from('paiements_ouvriers')
    .select('montant_calcule, montant_paye')
    .eq('id', id)
    .single()

  if (!current) return { error: 'Paiement introuvable' }

  const totalPaye = (current.montant_paye || 0) + montantPaye
  const statut = totalPaye >= current.montant_calcule
    ? 'paye'
    : totalPaye > 0
    ? 'partiel'
    : 'en_attente'

  const { data, error } = await supabase
    .from('paiements_ouvriers')
    .update({
      montant_paye: totalPaye,
      statut,
      date_paiement: statut === 'paye' ? new Date().toISOString().split('T')[0] : null,
      mode_paiement: modePaiement,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/paiements')
  return { paiement: data }
}
