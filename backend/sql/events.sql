-- Supabase SQL: Create events table with RBAC support
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  visibility VARCHAR(50) DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_created_by ON events(created_by);
CREATE INDEX idx_events_visibility ON events(visibility);

-- Enable RLS (Row Level Security)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- RLS Policy 1: Admin/Manager users can see all events
CREATE POLICY "admins_managers_can_view_all" ON events
  FOR SELECT
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policy 2: Regular users can see public events or their own events
CREATE POLICY "users_can_view_own_and_public" ON events
  FOR SELECT
  USING (
    visibility = 'public' OR created_by = auth.uid()
  );

-- RLS Policy 3: Only admin/manager can create events
CREATE POLICY "admins_managers_can_create" ON events
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policy 4: Only admin/manager can update events
CREATE POLICY "admins_managers_can_update" ON events
  FOR UPDATE
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policy 5: Only admin/manager can delete events
CREATE POLICY "admins_managers_can_delete" ON events
  FOR DELETE
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at_trigger
BEFORE UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION update_events_updated_at();
