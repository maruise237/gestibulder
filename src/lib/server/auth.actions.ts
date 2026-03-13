'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const enterpriseName = formData.get('enterpriseName') as string;

  const supabase = await createClient();

  // Inscription standard avec confirmation par email
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nom_complet: name,
        enterprise_name: enterpriseName,
      },
    },
  });

  if (authError) return { error: authError.message };

  // Avec confirmation email, l'utilisateur n'est pas encore "connecté"
  // tant qu'il n'a pas cliqué sur le lien. On ne peut pas faire de signIn automatique ici.

  return {
    success: true,
    message:
      'Veuillez vérifier votre boîte mail pour confirmer votre inscription avant de vous connecter.',
  };
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: error.message };

  return { success: true };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}
