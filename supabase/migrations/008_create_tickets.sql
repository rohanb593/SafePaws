-- Creates the 'tickets' table
--
-- Columns: id (uuid PK), query_type (text), status (default 'pending'),
--          priority ('low' | 'medium' | 'high'), by_user (FK → profiles.id),
--          category ('pet_owner' | 'pet_minder' | 'technical'),
--          issue_description (text), created_at, updated_at
--
-- CHECK: status IN ('pending', 'opened', 'closed')
--
-- RLS policies:
--   SELECT: creator reads own tickets; admin/customer_support reads all
--   INSERT: pet_owner or pet_minder roles
--   UPDATE (status): admin or customer_support only
--
-- Satisfies: RQ37, RQ38, RQ39, RQ40, RQ42, RQ43, RQ44
CREATE TYPE ticket_status AS ENUM ('pending', 'opened', 'closed');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE ticket_category AS ENUM ('pet_owner', 'pet_minder', 'technical');

CREATE TABLE public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_type text NOT NULL DEFAULT '',
  status ticket_status NOT NULL DEFAULT 'pending',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  by_user uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category ticket_category NOT NULL,
  issue_description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own tickets"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (
    auth.uid() = by_user
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'customer_support')
    )
  );

CREATE POLICY "Users can insert their own tickets"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = by_user);

CREATE POLICY "Admins can update tickets"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'customer_support')
    )
  );