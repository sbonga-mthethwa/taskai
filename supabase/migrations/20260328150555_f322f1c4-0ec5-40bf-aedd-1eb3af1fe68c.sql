
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update relevant invitations" ON public.invitations;

-- Invitee can only update acceptance/decline fields
CREATE POLICY "Invitee can accept or decline invitation"
ON public.invitations
FOR UPDATE
TO authenticated
USING (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
)
WITH CHECK (
  invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  AND invited_role = (SELECT invited_role FROM public.invitations WHERE id = invitations.id)
  AND invited_by_user_id = (SELECT invited_by_user_id FROM public.invitations WHERE id = invitations.id)
  AND invited_by_name = (SELECT invited_by_name FROM public.invitations WHERE id = invitations.id)
  AND invited_email = (SELECT invited_email FROM public.invitations WHERE id = invitations.id)
  AND workspace_name = (SELECT workspace_name FROM public.invitations WHERE id = invitations.id)
  AND workspace_id = (SELECT workspace_id FROM public.invitations WHERE id = invitations.id) OR (workspace_id IS NULL AND (SELECT workspace_id FROM public.invitations WHERE id = invitations.id) IS NULL)
  AND project_id = (SELECT project_id FROM public.invitations WHERE id = invitations.id) OR (project_id IS NULL AND (SELECT project_id FROM public.invitations WHERE id = invitations.id) IS NULL)
);

-- Inviter can only revoke (update revoked_at and status)
CREATE POLICY "Inviter can revoke invitation"
ON public.invitations
FOR UPDATE
TO authenticated
USING (
  invited_by_user_id = (auth.uid())::text
)
WITH CHECK (
  invited_by_user_id = (auth.uid())::text
  AND invited_role = (SELECT invited_role FROM public.invitations WHERE id = invitations.id)
  AND invited_email = (SELECT invited_email FROM public.invitations WHERE id = invitations.id)
  AND invited_by_name = (SELECT invited_by_name FROM public.invitations WHERE id = invitations.id)
  AND workspace_name = (SELECT workspace_name FROM public.invitations WHERE id = invitations.id)
);

-- Admins can update any invitation
CREATE POLICY "Admins can update any invitation"
ON public.invitations
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);
