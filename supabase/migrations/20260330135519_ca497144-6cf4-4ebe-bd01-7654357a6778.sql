
-- 1. FIX: Remove notifications from realtime to prevent cross-user channel snooping
ALTER PUBLICATION supabase_realtime DROP TABLE public.notifications;

-- 2. FIX: Workspace members - prevent self-insert with elevated role
DROP POLICY IF EXISTS "Admins or self can insert workspace members" ON public.workspace_members;

CREATE POLICY "Admins or self can insert workspace members"
  ON public.workspace_members FOR INSERT TO authenticated
  WITH CHECK (
    CASE
      WHEN has_role(auth.uid(), 'admin'::app_role) THEN true
      WHEN auth.uid() = user_id THEN role = 'employee'
      ELSE false
    END
  );

-- 3. FIX: Prevent non-admins from changing their own profiles.role
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Role changes require admin privileges';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;

CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_self_escalation();
