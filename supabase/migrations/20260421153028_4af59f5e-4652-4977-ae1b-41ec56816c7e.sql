-- Notes table
CREATE TABLE public.notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT 'default',
  pinned BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view notes" ON public.notes FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create notes" ON public.notes FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update notes" ON public.notes FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete notes" ON public.notes FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE TRIGGER set_updated_at_notes BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_notes_org ON public.notes(organization_id);
CREATE INDEX idx_notes_pinned ON public.notes(organization_id, pinned);

-- Reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  related_type TEXT,
  related_id UUID,
  notify BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members view reminders" ON public.reminders FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members create reminders" ON public.reminders FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) AND created_by = auth.uid());
CREATE POLICY "Org members update reminders" ON public.reminders FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members delete reminders" ON public.reminders FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE TRIGGER set_updated_at_reminders BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_reminders_org ON public.reminders(organization_id);
CREATE INDEX idx_reminders_due ON public.reminders(organization_id, due_at) WHERE completed = false;