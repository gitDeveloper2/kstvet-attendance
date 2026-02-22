import 'server-only';

import { getPublicEnv } from '@/lib/env';

type ServerEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};

function getRequired(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local and restart the dev server.`);
  }
  return value;
}

export function getServerEnv(): ServerEnv {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  const supabaseServiceRoleKey = getRequired(
    'SUPABASE_SERVICE_ROLE_KEY',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  return { supabaseUrl, supabaseAnonKey, supabaseServiceRoleKey };
}
