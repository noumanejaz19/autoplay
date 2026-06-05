-- =============================================================
-- Autoplay — Round 2 Feedback Migration
-- Run this in your Supabase SQL Editor AFTER 001–004.
-- =============================================================

-- ─── 1. DATED UPDATES (SS1) ───────────────────────────────────
-- Employees log updates with a date they choose (not just the post time).
ALTER TABLE public.client_updates
  ADD COLUMN IF NOT EXISTS update_date date DEFAULT current_date;

-- ─── 2. CLIENT DOCUMENTS — two buckets (SS3) ──────────────────
-- The client "Docs" tab. visibility = 'admin' (admins only) or
-- 'shared' (visible to the whole team).
CREATE TABLE IF NOT EXISTS public.client_documents (
  id          uuid primary key default uuid_generate_v4(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  title       text,
  url         text not null,
  file_name   text,
  mime_type   text,
  visibility  text not null default 'shared' check (visibility in ('admin', 'shared')),
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at  timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_client_documents_client ON public.client_documents(client_id);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_docs_admin_all" ON public.client_documents FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Non-admins can only see the "shared" docs.
CREATE POLICY "client_docs_shared_select" ON public.client_documents FOR SELECT
  USING (visibility = 'shared');

-- Any authenticated team member can add a document.
CREATE POLICY "client_docs_member_insert" ON public.client_documents FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

CREATE POLICY "client_docs_member_delete" ON public.client_documents FOR DELETE
  USING (public.current_profile_id() IS NOT NULL);

-- ─── 3. PROJECT PROGRESS LOG + MILESTONES (SS4) ───────────────
-- Employees log progress over time; each row captures the new %
-- (so we can show the change) and/or a milestone.
CREATE TABLE IF NOT EXISTS public.project_progress_log (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references public.projects(id) on delete cascade,
  percentage      integer check (percentage >= 0 and percentage <= 100),
  note            text,
  is_milestone    boolean default false,
  milestone_title text,
  logged_by       uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_progress_log_project ON public.project_progress_log(project_id);

ALTER TABLE public.project_progress_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_log_admin_all" ON public.project_progress_log FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "progress_log_member_select" ON public.project_progress_log FOR SELECT
  USING (public.is_project_member(project_id));

CREATE POLICY "progress_log_member_insert" ON public.project_progress_log FOR INSERT
  WITH CHECK (public.is_project_member(project_id));

-- ─── 4. STORAGE BUCKET FOR CLIENT FILES ───────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-files', 'client-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "client_files_auth_write" ON storage.objects;
CREATE POLICY "client_files_auth_write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'client-files');

DROP POLICY IF EXISTS "client_files_public_read" ON storage.objects;
CREATE POLICY "client_files_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'client-files');
