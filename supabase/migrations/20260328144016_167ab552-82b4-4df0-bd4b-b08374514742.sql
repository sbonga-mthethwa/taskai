
-- Fix: Remove permissive INSERT policy on workspace_members
-- All workspace membership is managed server-side via edge functions with service role
DROP POLICY IF EXISTS "Members can insert own membership" ON public.workspace_members;
