'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { NewEquipment } from '@/types/equipment';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getEquipments() {
  const supabase = await createClient();

  const { data: equipments, error } = await supabase
    .from('equipements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching equipments:', error);
    return { error: error.message };
  }

  return { equipments };
}

export async function createEquipment(data: NewEquipment) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: equipment, error } = await supabase
    .from('equipements')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating equipment:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/equipements');
  return { equipment };
}

export async function updateEquipmentStatus(equipmentId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('equipements')
    .update({ etat: status })
    .eq('id', equipmentId);

  if (error) {
    console.error('Error updating equipment status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/equipements');
  return { success: true };
}

export async function deployEquipment(data: {
  equipement_id: string;
  chantier_id: string;
  date_debut: string;
  date_fin: string;
}) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Create assignment
  const { error: assignError } = await supabase.from('affectations_equipements').insert([
    {
      ...data,
      entreprise_id,
      saisi_par: user?.id,
    },
  ]);

  if (assignError) return { error: assignError.message };

  // 2. Update equipment status
  const { error: statusError } = await supabase
    .from('equipements')
    .update({ etat: 'en_service' })
    .eq('id', data.equipement_id);

  if (statusError) return { error: statusError.message };

  revalidatePath('/dashboard/equipements');
  return { success: true };
}
