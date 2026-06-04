-- =============================================================
-- Autoplay — Dashboard Feedback Migration (Edmund / June 2026)
-- Run this in your Supabase SQL Editor AFTER 001, 002 and 003.
-- Implements the fixes & changes requested in the dashboard update request.
-- =============================================================

-- ─── 1. BUG FIX: allow 'In Progress' as a project status ──────
-- The projects status CHECK constraint never included 'In Progress',
-- but the UI offers it. Selecting it threw a CHECK violation that
-- surfaced as the bottom-right error toast. Re-create the constraint
-- with the full set of statuses the UI can produce.
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    'Discovery', 'Access Collection', 'Setup', 'Development',
    'Testing', 'Client Review', 'Deployment', 'Handover', 'Maintenance',
    'Paused', 'Completed', 'Cancelled', 'Planning', 'Active', 'On Hold',
    'In Progress'
  ));

-- ─── 2. SEPARATE ADMIN / EMPLOYEE NOTES ON PROJECTS ───────────
-- "Notes for me and the employee — in separate places, where we can
--  both see them and both add notes."
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS admin_notes    text,
  ADD COLUMN IF NOT EXISTS employee_notes text;

-- ─── 3. SCREENSHOTS ON TIME LOGS ──────────────────────────────
-- "Add a drag box where I can drag in screenshots of what an
--  employee has done for that time log entry."
ALTER TABLE public.time_logs
  ADD COLUMN IF NOT EXISTS screenshot_urls text[] DEFAULT '{}';

-- ─── 4. PROJECT RESOURCES TABLE ───────────────────────────────
-- Backs the project page: drag-in documents, linkable Loom videos,
-- and "needed documents" that employees/admins drag in for a project.
--   resource_type:
--     'document'         → a file dragged into the project
--     'needed_document'  → a file dragged in under "needed documents"
--     'loom'             → a pasted Loom (or other) video link
CREATE TABLE IF NOT EXISTS public.project_resources (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  resource_type text not null check (resource_type in ('document', 'needed_document', 'loom')),
  title         text,
  url           text not null,
  file_name     text,
  mime_type     text,
  added_by      uuid references public.profiles(id) on delete set null,
  created_at    timestamptz default now()
);

CREATE INDEX IF NOT EXISTS idx_project_resources_project ON public.project_resources(project_id);

ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "project_resources_admin_all" ON public.project_resources FOR ALL
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "project_resources_member_select" ON public.project_resources FOR SELECT
  USING (public.is_project_member(project_id));

CREATE POLICY "project_resources_member_insert" ON public.project_resources FOR INSERT
  WITH CHECK (public.is_project_member(project_id));

CREATE POLICY "project_resources_member_delete" ON public.project_resources FOR DELETE
  USING (public.is_project_member(project_id) OR public.is_admin());

-- ─── 5. STORAGE BUCKETS ───────────────────────────────────────
-- Buckets for the new drag-and-drop uploads. (You can also create
-- these in the Supabase dashboard → Storage if you prefer.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('time-log-screenshots', 'time-log-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to / read these buckets.
DROP POLICY IF EXISTS "project_files_auth_write" ON storage.objects;
CREATE POLICY "project_files_auth_write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'project-files');

DROP POLICY IF EXISTS "project_files_public_read" ON storage.objects;
CREATE POLICY "project_files_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files');

DROP POLICY IF EXISTS "screenshots_auth_write" ON storage.objects;
CREATE POLICY "screenshots_auth_write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'time-log-screenshots');

DROP POLICY IF EXISTS "screenshots_public_read" ON storage.objects;
CREATE POLICY "screenshots_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'time-log-screenshots');
