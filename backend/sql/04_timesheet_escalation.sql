-- ============================================
-- TIMESHEET ESCALATION & AUTOMATION TABLES
-- Hard cutoff workflow with 3-level escalation
-- ============================================

-- ============================================
-- 1. TIMESHEET ESCALATION TRACKING
-- Tracks escalation state for each day's timesheets
-- ============================================
CREATE TABLE IF NOT EXISTS timesheet_escalation_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to timesheet
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timesheet_date DATE NOT NULL, -- The day the timesheet is for
  
  -- Escalation state
  escalation_level INT DEFAULT 0, -- 0=none, 1=employee notified, 2=manager notified, 3=admin notified
  
  -- Timestamps for each level
  level_1_triggered_at TIMESTAMP WITH TIME ZONE, -- 20:00 - Employee notification
  level_2_triggered_at TIMESTAMP WITH TIME ZONE, -- 20:05 - Manager escalation
  level_3_triggered_at TIMESTAMP WITH TIME ZONE, -- 20:10 - Admin escalation
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'escalated', 'acknowledged', 'completed', 'overdue'
  
  -- Resolution
  completed_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  
  -- Escalation linked events
  escalation_event_id_level1 UUID REFERENCES escalation_events(id) ON DELETE SET NULL,
  escalation_event_id_level2 UUID REFERENCES escalation_events(id) ON DELETE SET NULL,
  escalation_event_id_level3 UUID REFERENCES escalation_events(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timesheet_escalation_user ON timesheet_escalation_tracking(user_id);
CREATE INDEX idx_timesheet_escalation_date ON timesheet_escalation_tracking(timesheet_date);
CREATE INDEX idx_timesheet_escalation_status ON timesheet_escalation_tracking(status);
CREATE INDEX idx_timesheet_escalation_level ON timesheet_escalation_tracking(escalation_level);
CREATE INDEX idx_timesheet_escalation_timesheet_id ON timesheet_escalation_tracking(timesheet_id);

-- ============================================
-- 2. TIMESHEET ESCALATION HISTORY
-- Audit trail for all escalation actions
-- ============================================
CREATE TABLE IF NOT EXISTS timesheet_escalation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  escalation_tracking_id UUID NOT NULL REFERENCES timesheet_escalation_tracking(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  
  -- Action details
  action VARCHAR(100) NOT NULL, -- 'triggered_level_1', 'triggered_level_2', 'triggered_level_3', 'acknowledged', 'completed', 'expired'
  escalation_level INT, -- Which level was escalated
  
  -- Who took the action
  triggered_by UUID REFERENCES users(id) ON DELETE SET NULL, -- System or Admin
  
  -- Context
  hours_submitted DECIMAL(6, 2),
  reason TEXT,
  notes JSONB,
  
  -- Timestamps
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalation_history_tracking_id ON timesheet_escalation_history(escalation_tracking_id);
CREATE INDEX idx_escalation_history_user_id ON timesheet_escalation_history(user_id);
CREATE INDEX idx_escalation_history_action ON timesheet_escalation_history(action);
CREATE INDEX idx_escalation_history_triggered_at ON timesheet_escalation_history(triggered_at);

-- ============================================
-- 3. TIMESHEET CUTOFF CONFIGURATION
-- Flexible cutoff times and escalation intervals
-- ============================================
CREATE TABLE IF NOT EXISTS timesheet_cutoff_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cutoff times (can be modified per organization)
  level_1_time TIME DEFAULT '20:00:00', -- Employee notification cutoff (e.g., 8:00 PM)
  level_2_time TIME DEFAULT '20:05:00', -- Manager escalation (e.g., 8:05 PM)
  level_3_time TIME DEFAULT '20:10:00', -- Admin escalation (e.g., 8:10 PM)
  
  -- Hard deadline (after this, timesheets are locked)
  hard_deadline_time TIME DEFAULT '23:59:59', -- End of day
  
  -- Escalation targets
  level_1_target_role VARCHAR(100) DEFAULT 'employee', -- Who gets level 1 notification
  level_2_target_role VARCHAR(100) DEFAULT 'manager', -- Who gets level 2 notification
  level_3_target_role VARCHAR(100) DEFAULT 'admin', -- Who gets level 3 notification
  
  -- Behavior
  auto_lock_after_deadline BOOLEAN DEFAULT TRUE, -- Lock timesheet after deadline
  allow_post_deadline_submission BOOLEAN DEFAULT FALSE, -- Allow overrides
  require_manager_approval_if_late BOOLEAN DEFAULT TRUE, -- Manager must approve late submissions
  
  -- Notification settings
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

CREATE INDEX idx_cutoff_is_active ON timesheet_cutoff_config(is_active);

-- ============================================
-- 4. TIMESHEET SUBMISSION AUDIT LOG
-- Track all submission attempts with timestamps
-- ============================================
CREATE TABLE IF NOT EXISTS timesheet_submission_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  timesheet_id UUID NOT NULL REFERENCES timesheets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Submission details
  submission_time TIMESTAMP WITH TIME ZONE,
  hours_submitted DECIMAL(6, 2),
  
  -- Cutoff check
  submitted_before_level_1 BOOLEAN, -- Submitted before 20:00
  submitted_before_level_2 BOOLEAN, -- Submitted before 20:05
  submitted_before_level_3 BOOLEAN, -- Submitted before 20:10
  submitted_after_deadline BOOLEAN, -- Submitted after hard deadline
  
  -- Status at submission
  status_at_submission VARCHAR(50),
  
  -- IP and device info
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_submission_audit_user ON timesheet_submission_audit(user_id);
CREATE INDEX idx_submission_audit_timesheet ON timesheet_submission_audit(timesheet_id);
CREATE INDEX idx_submission_audit_submission_time ON timesheet_submission_audit(submission_time);
CREATE INDEX idx_submission_audit_after_deadline ON timesheet_submission_audit(submitted_after_deadline);

-- ============================================
-- 5. ADD COLUMNS TO EXISTING TIMESHEETS TABLE
-- (Enhancement columns for escalation integration)
-- ============================================
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS escalation_tracking_id UUID REFERENCES timesheet_escalation_tracking(id);
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS escalation_level INT DEFAULT 0;
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS acknowledged_by_employee BOOLEAN DEFAULT FALSE;
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS requires_manager_approval BOOLEAN DEFAULT FALSE;
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS manager_approved_by UUID REFERENCES users(id);
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS manager_approved_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE timesheets ADD COLUMN IF NOT EXISTS manager_approval_notes TEXT;

-- ============================================
-- 6. SEEDED TIMESHEET CUTOFF CONFIGURATION
-- Insert default configuration if table is empty
-- ============================================
INSERT INTO timesheet_cutoff_config (
  level_1_time,
  level_2_time,
  level_3_time,
  hard_deadline_time,
  level_1_target_role,
  level_2_target_role,
  level_3_target_role,
  auto_lock_after_deadline,
  allow_post_deadline_submission,
  require_manager_approval_if_late,
  send_email_level_1,
  send_email_level_2,
  send_email_level_3,
  send_sms_level_2,
  send_sms_level_3,
  is_active
)
SELECT 
  '20:00:00'::TIME,
  '20:05:00'::TIME,
  '20:10:00'::TIME,
  '23:59:59'::TIME,
  'employee',
  'manager',
  'admin',
  TRUE,
  FALSE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  FALSE,
  FALSE,
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM timesheet_cutoff_config);

COMMIT;
