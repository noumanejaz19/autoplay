-- =============================================================
-- Autoplay — Row Level Security (RLS) Policies
-- Run AFTER 001_initial_schema.sql
-- =============================================================

-- Enable RLS on all tables
alter table public.profiles        enable row level security;
alter table public.clients         enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks           enable row level security;
alter table public.time_logs       enable row level security;
alter table public.client_assets   enable row level security;
alter table public.access_items    enable row level security;
alter table public.blockers        enable row level security;
alter table public.deliverables    enable row level security;
alter table public.approvals       enable row level security;
alter table public.timeline_entries enable row level security;
alter table public.notifications   enable row level security;
alter table public.audit_logs      enable row level security;

-- =============================================================
-- HELPER FUNCTIONS
-- =============================================================

-- Returns the profile id of the current auth user
create or replace function public.current_profile_id()
returns uuid language sql stable security definer as $$
  select id from public.profiles where auth_user_id = auth.uid() limit 1;
$$;

-- Returns true if the current user has the 'admin' role
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role = 'admin'
  );
$$;

-- Returns true if the current user is a member of the given project
create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id = public.current_profile_id()
  );
$$;

-- =============================================================
-- PROFILES
-- =============================================================
create policy "profiles_select" on public.profiles for select
  using (auth.uid() is not null);  -- Any logged-in user can see profiles (for team page)

create policy "profiles_update_own" on public.profiles for update
  using (auth_user_id = auth.uid());  -- User can only update their own profile

create policy "profiles_update_admin" on public.profiles for update
  using (public.is_admin());  -- Admin can update any profile

create policy "profiles_insert_admin" on public.profiles for insert
  with check (public.is_admin());  -- Only admin creates profiles manually (trigger handles signup)

-- =============================================================
-- CLIENTS
-- =============================================================

-- Admin: full access
create policy "clients_admin_all" on public.clients for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see only clients linked to their assigned projects
create policy "clients_user_select" on public.clients for select
  using (
    exists (
      select 1 from public.projects p
      join public.project_members pm on pm.project_id = p.id
      where p.client_id = clients.id
        and pm.user_id = public.current_profile_id()
    )
  );

-- =============================================================
-- PROJECTS
-- =============================================================

-- Admin: full access
create policy "projects_admin_all" on public.projects for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see only their assigned projects
create policy "projects_user_select" on public.projects for select
  using (public.is_project_member(id));

-- =============================================================
-- PROJECT MEMBERS
-- =============================================================

-- Admin: full access
create policy "project_members_admin_all" on public.project_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see members of their own projects
create policy "project_members_user_select" on public.project_members for select
  using (public.is_project_member(project_id));

-- =============================================================
-- TASKS
-- =============================================================

-- Admin: full access
create policy "tasks_admin_all" on public.tasks for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see/update tasks in their assigned projects
create policy "tasks_user_select" on public.tasks for select
  using (public.is_project_member(project_id));

create policy "tasks_user_update" on public.tasks for update
  using (
    assigned_to = public.current_profile_id()
    or public.is_project_member(project_id)
  );

-- =============================================================
-- TIME LOGS
-- =============================================================

-- Admin: full access
create policy "time_logs_admin_all" on public.time_logs for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see only their own time logs
create policy "time_logs_user_select" on public.time_logs for select
  using (user_id = public.current_profile_id());

create policy "time_logs_user_insert" on public.time_logs for insert
  with check (user_id = public.current_profile_id());

create policy "time_logs_user_update" on public.time_logs for update
  using (user_id = public.current_profile_id() and approved = false);

-- =============================================================
-- CLIENT ASSETS
-- =============================================================

-- Admin: full access
create policy "client_assets_admin_all" on public.client_assets for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see assets for their assigned projects
create policy "client_assets_user_select" on public.client_assets for select
  using (
    project_id is null
    or public.is_project_member(project_id)
  );

-- =============================================================
-- ACCESS ITEMS
-- =============================================================

-- Admin: full access
create policy "access_items_admin_all" on public.access_items for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see access items for their assigned projects (limited metadata only via view)
create policy "access_items_user_select" on public.access_items for select
  using (
    project_id is null
    or public.is_project_member(project_id)
  );

-- =============================================================
-- BLOCKERS
-- =============================================================

-- Admin: full access
create policy "blockers_admin_all" on public.blockers for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see blockers for their assigned projects
create policy "blockers_user_select" on public.blockers for select
  using (
    project_id is null
    or public.is_project_member(project_id)
  );

-- =============================================================
-- DELIVERABLES
-- =============================================================

-- Admin: full access
create policy "deliverables_admin_all" on public.deliverables for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see deliverables for their assigned projects
create policy "deliverables_user_select" on public.deliverables for select
  using (
    project_id is null
    or public.is_project_member(project_id)
  );

-- =============================================================
-- APPROVALS
-- =============================================================

-- Admin: full access
create policy "approvals_admin_all" on public.approvals for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see approvals for their assigned projects
create policy "approvals_user_select" on public.approvals for select
  using (
    project_id is null
    or public.is_project_member(project_id)
  );

-- =============================================================
-- TIMELINE ENTRIES
-- =============================================================

-- Admin: full access
create policy "timeline_admin_all" on public.timeline_entries for all
  using (public.is_admin())
  with check (public.is_admin());

-- User: see entries for their assigned projects (respecting visibility)
create policy "timeline_user_select" on public.timeline_entries for select
  using (
    public.is_project_member(project_id)
    and visibility in ('Project Team', 'Client-visible')
  );

-- User: insert their own entries
create policy "timeline_user_insert" on public.timeline_entries for insert
  with check (
    public.is_project_member(project_id)
    and created_by = public.current_profile_id()
  );

-- =============================================================
-- NOTIFICATIONS
-- =============================================================

-- Users only see their own notifications
create policy "notifications_own" on public.notifications for all
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

-- Admin can insert notifications for any user
create policy "notifications_admin_insert" on public.notifications for insert
  with check (public.is_admin());

-- =============================================================
-- AUDIT LOGS
-- =============================================================

-- Only admin can read audit logs
create policy "audit_logs_admin_select" on public.audit_logs for select
  using (public.is_admin());

-- Any authenticated user can insert their own audit entries (via trigger)
create policy "audit_logs_insert" on public.audit_logs for insert
  with check (auth.uid() is not null);
