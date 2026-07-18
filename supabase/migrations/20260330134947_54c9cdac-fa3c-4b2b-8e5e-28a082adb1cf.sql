
-- 1. FIX document_folders: scope write policies to folder creator
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.document_folders;
DROP POLICY IF EXISTS "Authenticated users can update folders" ON public.document_folders;
DROP POLICY IF EXISTS "Authenticated users can delete folders" ON public.document_folders;

CREATE POLICY "Owner can create folders"
  ON public.document_folders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner can update folders"
  ON public.document_folders FOR UPDATE TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Owner can delete folders"
  ON public.document_folders FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- 2. FIX document_file_mappings: scope write policies to mapping creator
DROP POLICY IF EXISTS "Authenticated users can create file mappings" ON public.document_file_mappings;
DROP POLICY IF EXISTS "Authenticated users can update file mappings" ON public.document_file_mappings;
DROP POLICY IF EXISTS "Authenticated users can delete file mappings" ON public.document_file_mappings;

CREATE POLICY "Owner can create file mappings"
  ON public.document_file_mappings FOR INSERT TO authenticated
  WITH CHECK (auth.uid()::text = moved_by);

CREATE POLICY "Owner can update file mappings"
  ON public.document_file_mappings FOR UPDATE TO authenticated
  USING (auth.uid()::text = moved_by)
  WITH CHECK (auth.uid()::text = moved_by);

CREATE POLICY "Owner can delete file mappings"
  ON public.document_file_mappings FOR DELETE TO authenticated
  USING (auth.uid()::text = moved_by);
