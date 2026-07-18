
-- Fix: Restrict document_folders SELECT to owner only
DROP POLICY IF EXISTS "Authenticated users can read folders" ON public.document_folders;

CREATE POLICY "Users can read own folders"
ON public.document_folders
FOR SELECT
TO authenticated
USING (created_by = auth.uid());
