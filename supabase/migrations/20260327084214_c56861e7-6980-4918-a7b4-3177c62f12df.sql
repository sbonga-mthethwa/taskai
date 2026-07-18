
CREATE TABLE public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  workspace_name text NOT NULL DEFAULT 'TaskAI',
  invited_email text NOT NULL,
  invited_role text NOT NULL DEFAULT 'employee',
  invited_department text,
  invited_by_user_id text NOT NULL,
  invited_by_name text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  declined_at timestamptz,
  accepted_by_user_id text,
  full_name text,
  employee_number text
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invitations"
  ON public.invitations FOR SELECT USING (true);

CREATE POLICY "Anyone can update invitations"
  ON public.invitations FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert invitations"
  ON public.invitations FOR INSERT WITH CHECK (true);
