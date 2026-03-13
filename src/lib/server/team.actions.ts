'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getTeamMembers() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('entreprise_id', entreprise_id)
    .order('nom_complet', { ascending: true });

  if (error) {
    console.error('Error fetching team members:', error);
    return { error: error.message };
  }

  return { members };
}

export async function inviteMember(
  email: string,
  name: string,
  role: 'admin' | 'superviseur' | 'chef_projet'
) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const admin = createAdminClient();
  if (!admin) return { error: "Configuration admin manquante" };

  // 1. Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      nom_complet: name,
      entreprise_id,
      invited_role: role,
    },
  });

  if (inviteError) {
    console.error('Invitation error:', inviteError);
    return { error: inviteError.message };
  }

  revalidatePath('/dashboard/team');
  return { success: true };
}
