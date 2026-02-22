# Supabase Setup & Connection Guide

## Step 1: Create Supabase Account
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or **Sign Up**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

## Step 2: Create New Project
1. After logging in, click **"New Project"**
2. Choose your organization (or create one)
3. Fill in project details:
   - **Project Name**: `kstvet-attendance`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (e.g., `East Africa`)
4. Click **"Create new project"**
5. Wait for project to be set up (2-3 minutes)

## Step 3: Get API Keys
1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://xxxxxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (click "reveal" to see)

## Step 4: Set Up Environment Variables
Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional compatibility (Supabase Next.js snippet)
# If Supabase gave you NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY instead of NEXT_PUBLIC_SUPABASE_ANON_KEY,
# you can either rename it to NEXT_PUBLIC_SUPABASE_ANON_KEY or keep it as-is.
# NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-supabase-publishable-key-here

# App Configuration
NEXT_PUBLIC_APP_NAME=KSTVET Attendance System
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder values with your actual Supabase credentials.

## Step 5: Set Up Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `database-schema.sql` from your project
3. Paste it into the SQL Editor
4. Click **"Run"** to execute the schema
5. This will create all tables, functions, and security policies

## Step 6: Configure Authentication
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add: `http://localhost:3000`
3. Under **Redirect URLs**, add: `http://localhost:3000/auth/callback`
4. Enable **Email** authentication provider if not already enabled

## Step 7: Test Connection
1. Run your development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000)
3. Try to sign up for a new account
4. Check if users appear in Supabase **Authentication** → **Users**

## Step 8: Verify Database Tables
1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `users`
   - `locations` 
   - `sessions`
   - `attendance`
3. Click on each to verify they have the correct structure

## Troubleshooting

### Common Issues:

**"Invalid JWT" Error**
- Check that your `.env.local` file has correct keys
- Ensure you're using the correct project URL

**"Database relation does not exist"**
- Make sure you ran the complete `database-schema.sql`
- Check SQL Editor for any execution errors

**"Permission denied"**
- Verify RLS policies were created correctly
- Check that your service role key is correct

**"CORS error"**
- Ensure your site URL is added to Supabase auth settings
- Check that you're using http://localhost:3000 for development

### Environment Variable Checklist:
- [ ] NEXT_PUBLIC_SUPABASE_URL is set correctly
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY is copied correctly
- [ ] SUPABASE_SERVICE_ROLE_KEY is copied correctly
- [ ] No extra spaces or quotes around values
- [ ] File is named exactly `.env.local` (not `.env`)

## Next Steps After Setup:

1. **Create a trainer account** and test session creation
2. **Create a trainee account** and test QR scanning
3. **Add some locations** with GPS coordinates
4. **Test attendance marking** with location verification
5. **Check reports** to see attendance data

## Production Deployment:

For Vercel deployment, add these environment variables in Vercel dashboard:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY  
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL (set to your Vercel URL)

Your KSTVET attendance system will be fully functional after completing these steps!
