import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getServerEnv } from '@/lib/env.server';

const { supabaseUrl, supabaseServiceRoleKey } = getServerEnv();

export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
