
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Authenticated users can create folders" ON public.document_folders;
DROP POLICY IF EXISTS "Owner or admin can delete folders" ON public.document_folders;
DROP POLICY IF EXISTS "Users can read own folders" ON public.document_folders;

-- Create permissive policies (auth is handled by Cognito, not Supabase Auth)
CREATE POLICY "Allow all reads on folders" ON public.document_folders FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on folders" ON public.document_folders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all deletes on folders" ON public.document_folders FOR DELETE USING (true);
CREATE POLICY "Allow all updates on folders" ON public.document_folders FOR UPDATE USING (true) WITH CHECK (true);
