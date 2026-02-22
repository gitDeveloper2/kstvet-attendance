# Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_or_publishable_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Optional compatibility (Supabase Next.js snippet)
# If Supabase gave you NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY instead of NEXT_PUBLIC_SUPABASE_ANON_KEY,
# you can either rename it to NEXT_PUBLIC_SUPABASE_ANON_KEY or keep it as-is.
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME=KSTVET Attendance System
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Instructions:

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API to get your URL and keys
3. Replace the placeholder values above with your actual Supabase credentials
4. The `.env.local` file should be in your root directory and will be automatically ignored by git
