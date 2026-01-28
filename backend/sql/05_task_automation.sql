-- ============================================
-- TASK OVERDUE & AUTOMATION TABLES
-- Dependencies tracking, auto-reopen, escalation
-- ============================================

-- ============================================
-- 1. TASK DEPENDENCIES TABLE
-- Track blocked/blocking relationships
-- ============================================
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Task relationship
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Dependency type
  dependency_type VARCHAR(50) NOT NULL, -- 'blocks', 'blocked_by', 'related_to'
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'waived', 'resolved'
  
  -- Timeline
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Notes
  reason TEXT,
  resolution_notes TEXT,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_deps_blocking ON task_dependencies(blocking_task_id);
CREATE INDEX idx_task_deps_blocked ON task_dependencies(blocked_task_id);
CREATE INDEX idx_task_deps_status ON task_dependencies(status);
CREATE INDEX idx_task_deps_is_active ON task_dependencies(is_active);

-- ============================================
-- 2. TASK OVERDUE TRACKING
-- Tracks overdue state and escalation level
-- ============================================
CREATE TABLE IF NOT EXISTS task_overdue_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Task reference
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Overdue details
  due_date DATE NOT NULL,
  days_overdue INT DEFAULT 0, -- How many days past due date
  
  -- Escalation state
  escalation_level INT DEFAULT 0, -- 0=none, 1=notified, 2=manager, 3=admin
  
  -- Escalation events
  escalation_event_id_level1 UUID REFERENCES escalation_events(id) ON DELETE SET NULL,
  escalation_event_id_level2 UUID REFERENCES escalation_events(id) ON DELETE SET NULL,
  escalation_event_id_level3 UUID REFERENCES escalation_events(id) ON DELETE SET NULL,
  
  -- Status
  status VARCHAR(50) DEFAULT 'overdue', -- 'overdue', 'escalated', 'resolved', 'reopened'
  
  -- Timestamps
  overdue_detected_at TIMESTAMP WITH TIME ZONE,
  level_1_triggered_at TIMESTAMP WITH TIME ZONE,
  level_2_triggered_at TIMESTAMP WITH TIME ZONE,
  level_3_triggered_at TIMESTAMP WITH TIME ZONE,
  
  -- Resolution
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution_type VARCHAR(100), -- 'completed', 'extended', 'reopened', 'cancelled'
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_overdue_task_id ON task_overdue_tracking(task_id);
CREATE INDEX idx_overdue_assigned_to ON task_overdue_tracking(assigned_to);
CREATE INDEX idx_overdue_status ON task_overdue_tracking(status);
CREATE INDEX idx_overdue_level ON task_overdue_tracking(escalation_level);
CREATE INDEX idx_overdue_due_date ON task_overdue_tracking(due_date);

-- ============================================
-- 3. TASK REOPEN HISTORY
-- Audit trail for all task reopenings
-- ============================================
CREATE TABLE IF NOT EXISTS task_reopen_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reopen details
  reopen_reason VARCHAR(100) NOT NULL, -- 'dependency_blocked', 'failed_qa', 'incomplete', 'manual_reopen'
  
  -- Who took action
  reopened_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- State before reopen
  status_before VARCHAR(50),
  assigned_to_before UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- New assignment (if changed)
  reassigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Context
  reason TEXT,
  dependency_id UUID REFERENCES task_dependencies(id) ON DELETE SET NULL,
  blocking_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  
  -- Timeline
  reopened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  new_due_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reopen_task_id ON task_reopen_history(task_id);
CREATE INDEX idx_reopen_user_id ON task_reopen_history(user_id);
CREATE INDEX idx_reopen_reason ON task_reopen_history(reopen_reason);
CREATE INDEX idx_reopen_reopened_by ON task_reopen_history(reopened_by);
CREATE INDEX idx_reopen_dependency_id ON task_reopen_history(dependency_id);

-- ============================================
-- 4. TASK DEPENDENCY WAIVER LOG
-- Track when dependencies are waived/ignored
-- ============================================
CREATE TABLE IF NOT EXISTS task_dependency_waivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  dependency_id UUID NOT NULL REFERENCES task_dependencies(id) ON DELETE CASCADE,
  blocking_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  blocked_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  
  -- Waiver details
  waiver_reason TEXT NOT NULL,
  approved_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'approved', -- 'approved', 'rejected', 'expired'
  
  -- Timeline
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Audit
  rejection_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_waiver_dependency_id ON task_dependency_waivers(dependency_id);
CREATE INDEX idx_waiver_status ON task_dependency_waivers(status);
CREATE INDEX idx_waiver_approved_by ON task_dependency_waivers(approved_by);
CREATE INDEX idx_waiver_expires_at ON task_dependency_waivers(expires_at);

-- ============================================
-- 5. TASK ESCALATION AUDIT LOG
-- Complete audit trail for task escalations
-- ============================================
CREATE TABLE IF NOT EXISTS task_escalation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  overdue_tracking_id UUID REFERENCES task_overdue_tracking(id) ON DELETE SET NULL,
  
  -- Action
  action VARCHAR(100) NOT NULL, -- 'triggered_level_1', 'triggered_level_2', 'triggered_level_3', 'reopened', 'completed'
  escalation_level INT,
  
  -- Actor
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL = System
  
  -- Context
  reason TEXT,
  details JSONB,
  
  -- Timeline
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_audit_task_id ON task_escalation_audit(task_id);
CREATE INDEX idx_task_audit_action ON task_escalation_audit(action);
CREATE INDEX idx_task_audit_triggered_by ON task_escalation_audit(triggered_by);
CREATE INDEX idx_task_audit_triggered_at ON task_escalation_audit(triggered_at);

-- ============================================
-- 6. TASK OVERDUE CONFIGURATION
-- Flexible overdue escalation thresholds
-- ============================================
CREATE TABLE IF NOT EXISTS task_overdue_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Escalation timing (days after due date)
  level_1_days_after_due INT DEFAULT 0, -- Immediate or X days
  level_2_days_after_due INT DEFAULT 3, -- 3 days after due
  level_3_days_after_due INT DEFAULT 5, -- 5 days after due
  
  -- Escalation targets
  level_1_target_role VARCHAR(100) DEFAULT 'employee', -- Assignee
  level_2_target_role VARCHAR(100) DEFAULT 'manager', -- Manager
  level_3_target_role VARCHAR(100) DEFAULT 'admin', -- Admin
  
  -- Behavior
  auto_reopen_if_blocked BOOLEAN DEFAULT TRUE, -- Auto reopen if dependency blocks
  allow_post_due_extension BOOLEAN DEFAULT TRUE, -- Allow time extension
  require_manager_approval_if_extended BOOLEAN DEFAULT TRUE,
  
  -- Dependency behavior
  block_completion_if_dependencies_pending BOOLEAN DEFAULT TRUE,
  auto_fail_dependent_tasks BOOLEAN DEFAULT FALSE, -- Auto-fail dependent tasks
  
  -- Notifications
  send_email_level_1 BOOLEAN DEFAULT TRUE,
  send_email_level_2 BOOLEAN DEFAULT TRUE,
  send_email_level_3 BOOLEAN DEFAULT TRUE,
  
  send_sms_level_2 BOOLEAN DEFAULT FALSE,
  send_sms_level_3 BOOLEAN DEFAULT FALSE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_task_config_is_active ON task_overdue_config(is_active);

-- ============================================
-- 7. ADD COLUMNS TO EXISTING TASKS TABLE
-- (Enhancement columns for overdue integration)
-- ============================================
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS overdue_tracking_id UUID REFERENCES task_overdue_tracking(id);
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS escalation_level INT DEFAULT 0;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS has_blocking_dependencies BOOLEAN DEFAULT FALSE;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reopened_count INT DEFAULT 0;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reopened_by UUID REFERENCES users(id);
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reopen_reason TEXT;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS extended_due_date DATE;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS extension_reason TEXT;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS extension_approved_by UUID REFERENCES users(id);

-- ============================================
-- 8. SEEDED TASK OVERDUE CONFIGURATION
-- Default configuration for task overdue automation
-- ============================================
INSERT INTO task_overdue_config (
  level_1_days_after_due,
  level_2_days_after_due,
  level_3_days_after_due,
  level_1_target_role,
  level_2_target_role,
  level_3_target_role,
  auto_reopen_if_blocked,
  allow_post_due_extension,
  require_manager_approval_if_extended,
  block_completion_if_dependencies_pending,
  auto_fail_dependent_tasks,
  send_email_level_1,
  send_email_level_2,
  send_email_level_3,
  send_sms_level_2,
  send_sms_level_3,
  is_active
)
SELECT 
  0,    -- Level 1: Immediate (same day as due date)
  3,    -- Level 2: 3 days after due
  5,    -- Level 3: 5 days after due
  'employee',
  'manager',
  'admin',
  TRUE,   -- Auto-reopen if blocked
  TRUE,   -- Allow post-due extension
  TRUE,   -- Require manager approval
  TRUE,   -- Block completion if dependencies pending
  FALSE,  -- Don't auto-fail dependents
  TRUE,   -- Send email L1
  TRUE,   -- Send email L2
  TRUE,   -- Send email L3
  FALSE,  -- No SMS L2
  FALSE,  -- No SMS L3
  TRUE    -- Active
WHERE NOT EXISTS (SELECT 1 FROM task_overdue_config);

COMMIT;
