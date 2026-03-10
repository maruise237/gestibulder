'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getTeamMembers() {
  const supabase = await createClient();

  const { data: members, error } = await supabase
    .from('profiles')
    .select('*')
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

  // 1. Invite user via Supabase Auth
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      nom_complet: name,
      enterprise_id,
      invited_role: role,
    },
  });

  if (inviteError) {
    console.error('Invitation error:', inviteError);
    return { error: inviteError.message };
  }

  // 2. Note: The actual profile creation should happen via trigger on auth.users insert
  // But since the trigger we wrote handles only 'admin' by default,
  // we might need to adjust it or handle it here if it's a specific role.
  // Our trigger currently sets role='admin'. Let's update the trigger in schema.sql later.

  revalidatePath('/dashboard/team');
  return { success: true };
}
