import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Load .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars: Record<string, string> = {};
envFile.split('\n').forEach((line) => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    envVars[key.trim()] = values.join('=').trim().replace(/^"|"$/g, '');
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking tables on:', supabaseUrl);
  const tablesToCheck = [
    'entreprises',
    'profiles',
    'chantiers',
    'ouvriers',
    'pointages',
    'materiaux',
    'mouvements_stock',
    'equipements',
    'affectations_equipements',
    'depenses',
  ];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message}`);
    } else {
      console.log(`Table '${table}': EXISTS`);
    }
  }
}

checkTables();
