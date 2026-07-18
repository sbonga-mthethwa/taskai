-- ============================================================
-- FIX 1: Invitation RLS policies (self-referencing subquery bug)
-- ============================================================

DROP POLICY IF EXISTS "Invitee can accept or decline invitation" ON public.invitations;

CREATE POLICY "Invitee can accept or decline invitation"
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
  )
  WITH CHECK (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
    AND invited_role = (SELECT i.invited_role FROM public.invitations i WHERE i.id = invitations.id)
    AND invited_by_user_id = (SELECT i.invited_by_user_id FROM public.invitations i WHERE i.id = invitations.id)
    AND invited_by_name = (SELECT i.invited_by_name FROM public.invitations i WHERE i.id = invitations.id)
    AND workspace_name = (SELECT i.workspace_name FROM public.invitations i WHERE i.id = invitations.id)
  );

DROP POLICY IF EXISTS "Inviter can revoke invitation" ON public.invitations;

CREATE POLICY "Inviter can revoke invitation"
  ON public.invitations
  FOR UPDATE
  TO authenticated
  USING (
    invited_by_user_id = (auth.uid())::text
  )
  WITH CHECK (
    invited_by_user_id = (auth.uid())::text
    AND invited_role = (SELECT i.invited_role FROM public.invitations i WHERE i.id = invitations.id)
    AND invited_email = (SELECT i.invited_email FROM public.invitations i WHERE i.id = invitations.id)
    AND invited_by_name = (SELECT i.invited_by_name FROM public.invitations i WHERE i.id = invitations.id)
    AND workspace_name = (SELECT i.workspace_name FROM public.invitations i WHERE i.id = invitations.id)
  );

-- ============================================================
-- FIX 2: document_folders — restrict from public to authenticated
-- ============================================================

DROP POLICY IF EXISTS "Allow all reads on folders" ON public.document_folders;
DROP POLICY IF EXISTS "Allow all inserts on folders" ON public.document_folders;
DROP POLICY IF EXISTS "Allow all updates on folders" ON public.document_folders;
DROP POLICY IF EXISTS "Allow all deletes on folders" ON public.document_folders;

CREATE POLICY "Authenticated users can read folders"
  ON public.document_folders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create folders"
  ON public.document_folders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update folders"
  ON public.document_folders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete folders"
  ON public.document_folders FOR DELETE TO authenticated USING (true);

-- ============================================================
-- FIX 3: document_file_mappings — restrict from public to authenticated
-- ============================================================

DROP POLICY IF EXISTS "Allow all reads on file mappings" ON public.document_file_mappings;
DROP POLICY IF EXISTS "Allow all inserts on file mappings" ON public.document_file_mappings;
DROP POLICY IF EXISTS "Allow all updates on file mappings" ON public.document_file_mappings;
DROP POLICY IF EXISTS "Allow all deletes on file mappings" ON public.document_file_mappings;

CREATE POLICY "Authenticated users can read file mappings"
  ON public.document_file_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create file mappings"
  ON public.document_file_mappings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update file mappings"
  ON public.document_file_mappings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete file mappings"
  ON public.document_file_mappings FOR DELETE TO authenticated USING (true);

-- ============================================================
-- FIX 4: workspace_members — add write policies
-- ============================================================

CREATE POLICY "Admins or self can insert workspace members"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins or self can update workspace members"
  ON public.workspace_members FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
  );

CREATE POLICY "Admins or self can delete workspace membership"
  ON public.workspace_members FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR auth.uid() = user_id
  );

-- ============================================================
-- FIX 5: profiles — allow workspace members to read peer profiles
-- ============================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own and workspace peer profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR id IN (
      SELECT wm.user_id FROM public.workspace_members wm
      WHERE wm.workspace_id IN (
        SELECT get_user_workspace_ids(auth.uid())
      )
    )
  );

-- ============================================================
-- FIX 6: Admin bootstrap function
-- ============================================================

CREATE OR REPLACE FUNCTION public.bootstrap_admin()
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles LIMIT 1) THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin'::app_role);
  RETURN true;
END;
$$;