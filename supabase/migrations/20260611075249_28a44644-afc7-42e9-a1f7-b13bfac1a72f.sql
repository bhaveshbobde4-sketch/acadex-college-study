
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID,
  action TEXT NOT NULL,
  target_user_id UUID,
  role public.app_role,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON public.admin_audit_log FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
