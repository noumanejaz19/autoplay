-- =============================================================
-- Autoplay — Initial Database Schema
-- Run this in your Supabase SQL Editor to set up all tables.
-- =============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- =============================================================
create table if not exists public.profiles (
  id                  uuid primary key default uuid_generate_v4(),
  auth_user_id        uuid unique references auth.users(id) on delete cascade,
  full_name           text not null,
  email               text not null,
  role                text not null default 'user' check (role in ('admin', 'user')),
  job_title           text,
  department          text,
  profile_photo_url   text,
  phone               text,
  timezone            text default 'UTC',
  location            text,
  bio                 text,
  skills              text[] default '{}',
  years_experience    integer default 0,
  certifications      text[] default '{}',
  linkedin_url        text,
  portfolio_url       text,
  availability_status text default 'Available' check (availability_status in ('Available', 'Busy', 'Away', 'On Leave')),
  is_active           boolean default true,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- =============================================================
-- 2. CLIENTS
-- =============================================================
create table if not exists public.clients (
  id                          uuid primary key default uuid_generate_v4(),
  company_name                text not null,
  contact_person_name         text not null,
  contact_email               text,
  contact_phone               text,
  whatsapp                    text,
  timezone                    text,
  preferred_channel           text default 'Email' check (preferred_channel in ('WhatsApp', 'Email', 'Slack', 'Telegram', 'Zoom', 'Phone')),
  industry                    text,
  website                     text,
  project_owner_id            uuid references public.profiles(id) on delete set null,
  priority                    text default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  status                      text default 'Active' check (status in ('Lead', 'Onboarding', 'Active', 'Paused', 'Completed', 'Archived')),
  health_status               text default 'Healthy' check (health_status in ('Healthy', 'At Risk', 'Blocked', 'Completed', 'Good')),
  internal_notes              text,
  created_by                  uuid references public.profiles(id) on delete set null,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- =============================================================
-- 3. PROJECTS
-- =============================================================
create table if not exists public.projects (
  id                        uuid primary key default uuid_generate_v4(),
  client_id                 uuid references public.clients(id) on delete cascade,
  project_name              text not null,
  description               text,
  project_type              text,
  start_date                date,
  expected_due_date         date,
  actual_completion_date    date,
  status                    text default 'Discovery' check (status in (
    'Discovery', 'Access Collection', 'Setup', 'Development',
    'Testing', 'Client Review', 'Deployment', 'Handover', 'Maintenance',
    'Paused', 'Completed', 'Cancelled', 'Planning', 'Active', 'On Hold'
  )),
  priority                  text default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Urgent')),
  progress_percentage       integer default 0 check (progress_percentage >= 0 and progress_percentage <= 100),
  project_manager_id        uuid references public.profiles(id) on delete set null,
  estimated_hours           numeric(8,2),
  budget                    numeric(12,2),
  tags                      text[] default '{}',
  internal_notes            text,
  created_by                uuid references public.profiles(id) on delete set null,
  created_at                timestamptz default now(),
  updated_at                timestamptz default now()
);

-- =============================================================
-- 4. PROJECT MEMBERS (many-to-many: projects ↔ profiles)
-- =============================================================
create table if not exists public.project_members (
  id            uuid primary key default uuid_generate_v4(),
  project_id    uuid not null references public.projects(id) on delete cascade,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  project_role  text default 'Member',
  assigned_at   timestamptz default now(),
  unique (project_id, user_id)
);

-- =============================================================
-- 5. TASKS
-- =============================================================
create table if not exists public.tasks (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid references public.projects(id) on delete cascade,
  client_id         uuid references public.clients(id) on delete cascade,
  title             text not null,
  description       text,
  assigned_to       uuid references public.profiles(id) on delete set null,
  created_by        uuid references public.profiles(id) on delete set null,
  status            text default 'To Do' check (status in (
    'Backlog', 'To Do', 'In Progress', 'Waiting on Client',
    'Waiting on Internal Review', 'Testing', 'Completed', 'Blocked'
  )),
  priority          text default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  due_date          date,
  estimated_hours   numeric(6,2),
  client_visible    boolean default false,
  internal_only     boolean default true,
  tags              text[] default '{}',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  completed_at      timestamptz
);

-- =============================================================
-- 6. TIME LOGS
-- =============================================================
create table if not exists public.time_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  client_id       uuid references public.clients(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  task_id         uuid references public.tasks(id) on delete set null,
  work_date       date not null default current_date,
  hours           numeric(5,2) not null check (hours > 0),
  work_description text,
  category        text default 'Development' check (category in (
    'Development', 'Research', 'Meeting', 'Communication',
    'Deployment', 'Testing', 'Documentation', 'Support', 'Management', 'Planning'
  )),
  billable        boolean default true,
  approved        boolean default false,
  approved_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- =============================================================
-- 7. CLIENT ASSETS
-- =============================================================
create table if not exists public.client_assets (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  project_id            uuid references public.projects(id) on delete set null,
  title                 text not null,
  description           text,
  asset_type            text default 'Other' check (asset_type in (
    'Document', 'PDF', 'Spreadsheet', 'Image', 'Video', 'Loom',
    'Google Drive', 'Google Sheet', 'Google Doc', 'API Docs',
    'Screenshot', 'Contract', 'Brand Assets', 'Reference Link',
    'Transcript', 'Other'
  )),
  file_url              text,
  external_url          text,
  uploaded_by           uuid references public.profiles(id) on delete set null,
  provided_by_client    boolean default false,
  visibility            text default 'Internal' check (visibility in ('Internal', 'Project Team', 'Client-visible')),
  is_pinned             boolean default false,
  tags                  text[] default '{}',
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- =============================================================
-- 8. ACCESS ITEMS (credentials tracker — no raw secrets stored)
-- =============================================================
create table if not exists public.access_items (
  id                      uuid primary key default uuid_generate_v4(),
  client_id               uuid not null references public.clients(id) on delete cascade,
  project_id              uuid references public.projects(id) on delete set null,
  service_name            text not null,
  category                text default 'Other' check (category in (
    'Hosting', 'Domain', 'Repository', 'API', 'Communication',
    'Database', 'CRM', 'Automation', 'Storage', 'Social',
    'Lead Generation', 'Email', 'Infrastructure', 'Messaging', 'Development', 'Other'
  )),
  access_status           text default 'Pending' check (access_status in (
    'Pending', 'Received', 'Configured', 'Tested',
    'Not Working', 'Need Client Action', 'Revoked'
  )),
  responsible_user_id     uuid references public.profiles(id) on delete set null,
  secure_location_ref     text,
  login_email             text,
  access_notes            text,
  action_required         text,
  last_tested_date        date,
  priority                text default 'Medium' check (priority in ('Low', 'Medium', 'High', 'Critical')),
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- =============================================================
-- 9. BLOCKERS
-- =============================================================
create table if not exists public.blockers (
  id                    uuid primary key default uuid_generate_v4(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  project_id            uuid references public.projects(id) on delete set null,
  related_task_id       uuid references public.tasks(id) on delete set null,
  related_access_id     uuid references public.access_items(id) on delete set null,
  title                 text not null,
  description           text,
  needed_from           text default 'Client' check (needed_from in ('Client', 'Team', 'Vendor', 'Technical')),
  impact                text default 'High' check (impact in ('Low', 'Medium', 'High', 'Critical')),
  status                text default 'Open' check (status in ('Open', 'In Progress', 'Resolved', 'Escalated')),
  responsible_user_id   uuid references public.profiles(id) on delete set null,
  requested_date        date default current_date,
  follow_up_date        date,
  resolved_at           timestamptz,
  resolution_notes      text,
  notes                 text,
  created_at            timestamptz default now(),
  updated_at            timestamptz default now()
);

-- =============================================================
-- 10. DELIVERABLES
-- =============================================================
create table if not exists public.deliverables (
  id                  uuid primary key default uuid_generate_v4(),
  client_id           uuid not null references public.clients(id) on delete cascade,
  project_id          uuid references public.projects(id) on delete set null,
  title               text not null,
  description         text,
  deliverable_type    text default 'Other' check (deliverable_type in (
    'Report', 'CSV', 'Dashboard', 'Deployed URL', 'Demo Video',
    'GitHub PR', 'Documentation', 'Testing Results', 'Handover Docs',
    'Client Update', 'Other'
  )),
  status              text default 'Draft' check (status in (
    'Draft', 'Ready', 'Sent', 'Approved', 'Needs Revision'
  )),
  file_url            text,
  external_url        text,
  created_by          uuid references public.profiles(id) on delete set null,
  sent_date           date,
  approved_date       date,
  client_visible      boolean default true,
  notes               text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- =============================================================
-- 11. APPROVALS
-- =============================================================
create table if not exists public.approvals (
  id                      uuid primary key default uuid_generate_v4(),
  client_id               uuid not null references public.clients(id) on delete cascade,
  project_id              uuid references public.projects(id) on delete set null,
  related_deliverable_id  uuid references public.deliverables(id) on delete set null,
  approval_type           text default 'scope' check (approval_type in (
    'scope', 'design', 'content', 'deployment', 'final_delivery',
    'change_request', 'access'
  )),
  title                   text not null,
  description             text,
  status                  text default 'Not Submitted' check (status in (
    'Not Submitted', 'Submitted', 'Under Review', 'Approved',
    'Rejected', 'Changes Requested'
  )),
  submitted_by            uuid references public.profiles(id) on delete set null,
  approved_by             uuid references public.profiles(id) on delete set null,
  submitted_at            timestamptz,
  reviewed_at             timestamptz,
  notes                   text,
  created_at              timestamptz default now(),
  updated_at              timestamptz default now()
);

-- =============================================================
-- 12. TIMELINE ENTRIES
-- =============================================================
create table if not exists public.timeline_entries (
  id                      uuid primary key default uuid_generate_v4(),
  client_id               uuid not null references public.clients(id) on delete cascade,
  project_id              uuid references public.projects(id) on delete set null,
  created_by              uuid references public.profiles(id) on delete set null,
  entry_type              text default 'internal_note' check (entry_type in (
    'client_request', 'internal_note', 'meeting_note', 'decision',
    'follow_up', 'delivered', 'blocker_update', 'access_update',
    'status_change', 'system_activity', 'ai_summary'
  )),
  title                   text not null,
  description             text,
  related_task_id         uuid references public.tasks(id) on delete set null,
  related_asset_id        uuid references public.client_assets(id) on delete set null,
  related_deliverable_id  uuid references public.deliverables(id) on delete set null,
  visibility              text default 'Internal' check (visibility in ('Internal', 'Project Team', 'Client-visible')),
  created_at              timestamptz default now()
);

-- =============================================================
-- 13. NOTIFICATIONS
-- =============================================================
create table if not exists public.notifications (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  title                 text not null,
  message               text,
  type                  text default 'info' check (type in ('info', 'success', 'warning', 'error', 'task', 'blocker', 'approval')),
  related_entity_type   text,
  related_entity_id     uuid,
  is_read               boolean default false,
  created_at            timestamptz default now()
);

-- =============================================================
-- 14. AUDIT LOGS
-- =============================================================
create table if not exists public.audit_logs (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references public.profiles(id) on delete set null,
  action        text not null,
  entity_type   text not null,
  entity_id     uuid,
  old_values    jsonb,
  new_values    jsonb,
  created_at    timestamptz default now()
);

-- =============================================================
-- INDEXES for performance
-- =============================================================
create index if not exists idx_projects_client_id       on public.projects(client_id);
create index if not exists idx_project_members_project  on public.project_members(project_id);
create index if not exists idx_project_members_user     on public.project_members(user_id);
create index if not exists idx_tasks_project_id         on public.tasks(project_id);
create index if not exists idx_tasks_assigned_to        on public.tasks(assigned_to);
create index if not exists idx_tasks_status             on public.tasks(status);
create index if not exists idx_time_logs_user_id        on public.time_logs(user_id);
create index if not exists idx_time_logs_project_id     on public.time_logs(project_id);
create index if not exists idx_time_logs_work_date      on public.time_logs(work_date);
create index if not exists idx_client_assets_client_id  on public.client_assets(client_id);
create index if not exists idx_access_items_client_id   on public.access_items(client_id);
create index if not exists idx_blockers_client_id       on public.blockers(client_id);
create index if not exists idx_blockers_status          on public.blockers(status);
create index if not exists idx_deliverables_client_id   on public.deliverables(client_id);
create index if not exists idx_approvals_client_id      on public.approvals(client_id);
create index if not exists idx_timeline_client_id       on public.timeline_entries(client_id);
create index if not exists idx_notifications_user_id    on public.notifications(user_id);
create index if not exists idx_notifications_is_read    on public.notifications(is_read);

-- =============================================================
-- TRIGGER: auto-update updated_at timestamp
-- =============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles        for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.clients         for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.projects        for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.tasks           for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.time_logs       for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.client_assets   for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.access_items    for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.blockers        for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.deliverables    for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.approvals       for each row execute function public.handle_updated_at();

-- =============================================================
-- TRIGGER: auto-create profile on Supabase auth signup
-- =============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (auth_user_id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
