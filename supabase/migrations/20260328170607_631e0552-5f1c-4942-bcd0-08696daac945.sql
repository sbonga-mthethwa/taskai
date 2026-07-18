
CREATE TABLE public.document_file_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id text NOT NULL UNIQUE,
  folder_id text NOT NULL,
  moved_by text,
  moved_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.document_file_mappings ENABLE ROW LEVEL SECURITY;

-- Permissive policies (auth is handled by Cognito, not Supabase Auth)
CREATE POLICY "Allow all reads on file mappings" ON public.document_file_mappings FOR SELECT USING (true);
CREATE POLICY "Allow all inserts on file mappings" ON public.document_file_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates on file mappings" ON public.document_file_mappings FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow all deletes on file mappings" ON public.document_file_mappings FOR DELETE USING (true);
