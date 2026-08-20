CREATE TABLE public.system_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  level text NOT NULL CHECK (level IN ('info','warn','error','critical')),
  source text NOT NULL,
  event_type text NOT NULL,
  status_code integer,
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_system_logs_created_at ON public.system_logs (created_at DESC);
CREATE INDEX idx_system_logs_source ON public.system_logs (source);
CREATE INDEX idx_system_logs_level ON public.system_logs (level);

GRANT SELECT ON public.system_logs TO authenticated;
GRANT ALL ON public.system_logs TO service_role;

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system logs"
ON public.system_logs FOR SELECT
TO authenticated
USING (public.is_admin_or_superadmin(auth.uid()));

CREATE POLICY "Superadmins can delete system logs"
ON public.system_logs FOR DELETE
TO authenticated
USING (public.is_superadmin(auth.uid()));