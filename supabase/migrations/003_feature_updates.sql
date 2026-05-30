-- =============================================================
-- Autoplay — Feature Updates Migration
-- Run this in Supabase SQL Editor AFTER 001 and 002
-- =============================================================

-- ─── 1. UPDATE CLIENT STATUS VALUES ───────────────────────────
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_status_check;
ALTER TABLE public.clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('Upcoming', 'In The Talk', 'Prioritized', 'Active', 'Closed', 'Completed', 'Archived'));

-- Migrate any old status values to nearest equivalent
UPDATE public.clients SET status = 'In The Talk' WHERE status = 'Lead';
UPDATE public.clients SET status = 'Active'      WHERE status = 'Onboarding';
UPDATE public.clients SET status = 'Active'      WHERE status = 'Paused';

-- ─── 2. ADD BLOCKER "ASKED CLIENT" STATUS ─────────────────────
ALTER TABLE public.blockers DROP CONSTRAINT IF EXISTS blockers_status_check;
ALTER TABLE public.blockers ADD CONSTRAINT blockers_status_check
  CHECK (status IN ('Open', 'In Progress', 'Asked Client', 'Resolved', 'Escalated'));

ALTER TABLE public.blockers
  ADD COLUMN IF NOT EXISTS asked_client_at timestamptz,
  ADD COLUMN IF NOT EXISTS asked_client_message text;

-- ─── 3. ADD FIELDS TO PROJECTS ────────────────────────────────
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS overdue_reason      text,
  ADD COLUMN IF NOT EXISTS employee_category   text;

-- ─── 4. ADD GOOGLE DRIVE FOLDER URL TO CLIENTS ────────────────
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS drive_folder_url text;

-- ─── 5. ADD RECORDING URL TO TIME LOGS ────────────────────────
ALTER TABLE public.time_logs
  ADD COLUMN IF NOT EXISTS recording_url text;

-- ─── 6. PROJECT DOCUMENTS TABLE ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.project_documents (
  id           uuid primary key default uuid_generate_v4(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  section_type text not null check (section_type in (
    'setup_requirements', 'what_is_needed', 'plans', 'overdeliver'
  )),
  notes        text,
  link_url     text,
  link_title   text,
  updated_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  UNIQUE (project_id, section_type)
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS for project_documents
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_docs_admin_all" ON public.project_documents FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "project_docs_member_select" ON public.project_documents FOR SELECT
  USING (public.is_project_member(project_id));

CREATE POLICY "project_docs_member_upsert" ON public.project_documents FOR INSERT
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "project_docs_member_update" ON public.project_documents FOR UPDATE
  USING (public.is_project_member(project_id));

-- ─── 7. CLIENT UPDATES TABLE ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.client_updates (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  project_id  uuid references public.projects(id) on delete set null,
  posted_by   uuid references public.profiles(id) on delete set null,
  content     text not null,
  update_type text default 'general' check (update_type in (
    'general', 'progress', 'blocker', 'milestone', 'note'
  )),
  created_at  timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_client_updates_client_id ON public.client_updates(client_id);
CREATE INDEX IF NOT EXISTS idx_client_updates_created_at ON public.client_updates(created_at DESC);

ALTER TABLE public.client_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_updates_admin_all" ON public.client_updates FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "client_updates_member_select" ON public.client_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.project_members pm ON pm.project_id = p.id
      WHERE p.client_id = client_updates.client_id
        AND pm.user_id = public.current_profile_id()
    )
  );

CREATE POLICY "client_updates_member_insert" ON public.client_updates FOR INSERT
  WITH CHECK (posted_by = public.current_profile_id());

-- ─── 8. USER PERMISSIONS TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id                    uuid primary key default uuid_generate_v4(),
  profile_id            uuid not null references public.profiles(id) on delete cascade UNIQUE,
  allowed_client_ids    uuid[] default '{}',
  can_view_all_clients  boolean default false,
  can_view_time_logs    boolean default true,
  can_view_reports      boolean default false,
  can_post_updates      boolean default true,
  can_manage_assets     boolean default true,
  can_manage_tasks      boolean default true,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_permissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_permissions_admin_all" ON public.user_permissions FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "user_permissions_own_select" ON public.user_permissions FOR SELECT
  USING (profile_id = public.current_profile_id());

-- Auto-create permissions row when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_permissions()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_permissions (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile_permissions();
