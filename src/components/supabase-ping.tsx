'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function SupabasePing() {
  useEffect(() => {
    const supabase = createClient();
    supabase.auth
      .getSession()
      .then(() => console.log('Supabase Setup Verified'))
      .catch((error) => console.error('Supabase Connection Error:', error));
  }, []);

  return null;
}
