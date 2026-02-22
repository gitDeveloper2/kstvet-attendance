import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';
import { getPublicEnv } from '@/lib/env';

const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
