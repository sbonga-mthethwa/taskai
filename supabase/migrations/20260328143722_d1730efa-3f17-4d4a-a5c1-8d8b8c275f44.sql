
-- Fix: Restrict workspace_members SELECT to same-workspace members only
DROP POLICY IF EXISTS "Members can read workspace members" ON public.workspace_members;

-- Use a security definer function to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(_user_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT workspace_id FROM public.workspace_members WHERE user_id = _user_id
$$;

CREATE POLICY "Members can read workspace members"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));
