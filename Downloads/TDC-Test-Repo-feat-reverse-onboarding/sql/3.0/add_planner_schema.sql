-- ==========================================
-- ADMIN PLANNER SCHEMA (Jira-like internal board)
-- Section: CORE > PLANNER
-- Standalone internal planning board: projects + milestones with
-- deadlines, status, priority, descriptions, and assigned members.
-- Idempotent: safe to re-run.
-- ==========================================

-- ------------------------------------------
-- 1. PLANNER PROJECTS (top-level epics)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_projects (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'PENDING',        -- PENDING | IN_PROGRESS | COMPLETED
    deadline timestamp with time zone,
    members jsonb NOT NULL DEFAULT '[]'::jsonb,     -- [{ id, name }]
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.planner_projects ENABLE ROW LEVEL SECURITY;

-- Only the service role (admin server logic) may read/write.
DROP POLICY IF EXISTS "Service role full control planner_projects" ON public.planner_projects;
CREATE POLICY "Service role full control planner_projects"
ON public.planner_projects FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_planner_projects_status ON public.planner_projects(status);
CREATE INDEX IF NOT EXISTS idx_planner_projects_deadline ON public.planner_projects(deadline);

-- ------------------------------------------
-- 2. PLANNER MILESTONES (tasks within a project)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_milestones (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id uuid REFERENCES public.planner_projects(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'PENDING',        -- PENDING | IN_PROGRESS | COMPLETED
    priority text NOT NULL DEFAULT 'MEDIUM',        -- LOW | MEDIUM | HIGH
    deadline timestamp with time zone,
    assignees jsonb NOT NULL DEFAULT '[]'::jsonb,   -- [{ id, name }]
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.planner_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full control planner_milestones" ON public.planner_milestones;
CREATE POLICY "Service role full control planner_milestones"
ON public.planner_milestones FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_planner_milestones_project ON public.planner_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_planner_milestones_status ON public.planner_milestones(status);
CREATE INDEX IF NOT EXISTS idx_planner_milestones_deadline ON public.planner_milestones(deadline);
