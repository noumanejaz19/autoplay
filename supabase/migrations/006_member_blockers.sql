-- =============================================================
-- Autoplay — Let assigned members add/update blockers
-- Run in Supabase SQL Editor after 001–005.
-- =============================================================
-- Members could only SELECT blockers on their assigned projects.
-- Allow them to add and update blockers on those projects too, so they
-- can flag issues themselves (admins still see everything).

DROP POLICY IF EXISTS "blockers_user_insert" ON public.blockers;
CREATE POLICY "blockers_user_insert" ON public.blockers FOR INSERT
  WITH CHECK (public.is_project_member(project_id));

DROP POLICY IF EXISTS "blockers_user_update" ON public.blockers;
CREATE POLICY "blockers_user_update" ON public.blockers FOR UPDATE
  USING (public.is_project_member(project_id));
