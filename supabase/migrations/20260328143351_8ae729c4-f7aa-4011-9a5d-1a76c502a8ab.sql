
-- Fix: Restrict profiles SELECT so users can only read their own profile
-- The app fetches team data via external API, not direct Supabase queries
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;

CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);
