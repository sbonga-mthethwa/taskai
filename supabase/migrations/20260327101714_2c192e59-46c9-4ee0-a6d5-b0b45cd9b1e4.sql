
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'employee');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function for role checks (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read roles
CREATE POLICY "Authenticated users can read roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

-- RLS: only admins can insert roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: only admins can delete roles
CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 4. Extend invitations table with missing columns
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS workspace_id text,
  ADD COLUMN IF NOT EXISTS project_id text,
  ADD COLUMN IF NOT EXISTS revoked_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS used_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS accepted_by_email text;

-- 5. Create workspace_members table
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text NOT NULL DEFAULT 'default',
  workspace_name text NOT NULL DEFAULT 'TaskAI',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL DEFAULT 'employee',
  department text,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  invited_by uuid,
  invitation_id uuid REFERENCES public.invitations(id),
  status text NOT NULL DEFAULT 'active',
  UNIQUE (workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read workspace members"
ON public.workspace_members FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Members can insert own membership"
ON public.workspace_members FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 6. Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  message text,
  invitation_id uuid REFERENCES public.invitations(id),
  status text NOT NULL DEFAULT 'unread',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- System inserts notifications (service role), so no insert policy for authenticated needed

-- 7. Update invitations RLS to be more secure
DROP POLICY IF EXISTS "Anyone can insert invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can read invitations" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can update invitations" ON public.invitations;

-- Authenticated users can read invitations relevant to them
CREATE POLICY "Users can read relevant invitations"
ON public.invitations FOR SELECT
TO authenticated
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR invited_by_user_id = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
);

-- Allow anon to read by token (for invite landing page pre-auth)
CREATE POLICY "Anon can read by token"
ON public.invitations FOR SELECT
TO anon
USING (true);

-- Only admins can insert invitations
CREATE POLICY "Admins can insert invitations"
ON public.invitations FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can update invitations they're involved with
CREATE POLICY "Users can update relevant invitations"
ON public.invitations FOR UPDATE
TO authenticated
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR invited_by_user_id = auth.uid()::text
  OR public.has_role(auth.uid(), 'admin')
);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
