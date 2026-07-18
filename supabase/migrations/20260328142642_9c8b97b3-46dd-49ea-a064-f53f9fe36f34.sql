
-- 1. Fix: Remove overly permissive anon read policy on invitations
DROP POLICY IF EXISTS "Anon can read by token" ON public.invitations;

-- Replace with a restrictive policy that only allows reading by specific token via query param
-- Since all invitation lookups go through edge functions with service role,
-- we don't need anon access at all. Remove it entirely.

-- 2. Fix: Restrict user_roles read policy so users can only see their own roles
DROP POLICY IF EXISTS "Authenticated users can read roles" ON public.user_roles;

CREATE POLICY "Users can read own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3. Fix: Also update invitations INSERT policy to allow any authenticated user (project owners)
-- instead of only admins, since we removed the admin role model
DROP POLICY IF EXISTS "Admins can insert invitations" ON public.invitations;

CREATE POLICY "Authenticated users can insert invitations"
ON public.invitations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::text = invited_by_user_id);
