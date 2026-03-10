'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getAuthenticatedEnterpriseId } from './utils';

export async function getProjects() {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('entreprise_id', entreprise_id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
    return { error: error.message };
  }

  return { projects };
}

export async function createProject(data: any) {
  const { entreprise_id, error: authError } = await getAuthenticatedEnterpriseId();
  if (authError) return { error: authError };

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from('chantiers')
    .insert([{ ...data, entreprise_id }])
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/chantiers');
  return { project };
}

export async function updateProjectStatus(projectId: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('chantiers').update({ statut: status }).eq('id', projectId);

  if (error) {
    console.error('Error updating project status:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard/chantiers');
  return { success: true };
}

export async function getProjectById(id: string) {
  const supabase = await createClient();

  const { data: project, error } = await supabase
    .from('chantiers')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return { error: error.message };
  }

  return { project };
}
