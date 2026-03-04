type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function getRequired(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local and restart the dev server.`);
  }
  return value.trim();
}

function validateSupabaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      `Invalid NEXT_PUBLIC_SUPABASE_URL. Expected a full URL starting with https:// (got: ${trimmed}).`
    );
  }
  return trimmed;
}

function resolveSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ) as string;
}

export function getPublicEnv(): PublicEnv {
  const supabaseUrl = validateSupabaseUrl(
    getRequired(
    'NEXT_PUBLIC_SUPABASE_URL',
    process.env.NEXT_PUBLIC_SUPABASE_URL
    )
  );

  const supabaseAnonKey = getRequired(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)',
    resolveSupabaseAnonKey()
  );

  return { supabaseUrl, supabaseAnonKey };
}
