-- ============================================
-- SYSTEM CONFIG GOVERNANCE TABLES
-- For attendance, timesheet, payroll settings
-- ============================================

-- ============================================
-- 1. SYSTEM CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Config key (unique identifier)
  config_key VARCHAR(255) NOT NULL UNIQUE,
  config_name VARCHAR(255) NOT NULL,
  config_description TEXT,
  
  -- Config value (JSON for flexibility)
  config_value JSONB NOT NULL,
  
  -- Data type for validation
  data_type VARCHAR(50) DEFAULT 'string', -- 'string', 'number', 'json', 'boolean'
  
  -- Approval workflow status
  approval_status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending_approval', 'pending_activation'
  
  -- Sign-off tracking (dual approval)
  requires_dual_approval BOOLEAN DEFAULT FALSE,
  approval_1_by UUID, -- First approver (usually HR)
  approval_1_at TIMESTAMP WITH TIME ZONE,
  approval_2_by UUID, -- Second approver (usually Finance/Admin)
  approval_2_at TIMESTAMP WITH TIME ZONE,
  
  -- Change tracking
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  is_active BOOLEAN DEFAULT TRUE,
  version INT DEFAULT 1 -- Track config versions
);

CREATE INDEX idx_config_key ON system_config(config_key);
CREATE INDEX idx_config_approval_status ON system_config(approval_status);
CREATE INDEX idx_config_active ON system_config(is_active);

-- ============================================
-- 2. CONFIG AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS config_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  config_id UUID NOT NULL REFERENCES system_config(id) ON DELETE CASCADE,
  config_key VARCHAR(255) NOT NULL,
  
  -- Change details
  old_value JSONB,
  new_value JSONB NOT NULL,
  
  -- Who made the change
  changed_by UUID NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approval trail
  approval_required BOOLEAN DEFAULT FALSE,
  approval_1_by UUID,
  approval_1_at TIMESTAMP WITH TIME ZONE,
  approval_1_comment TEXT,
  approval_2_by UUID,
  approval_2_at TIMESTAMP WITH TIME ZONE,
  approval_2_comment TEXT,
  
  -- Payroll impact flag
  is_payroll_affecting BOOLEAN DEFAULT FALSE,
  payroll_halt_if_suspicious BOOLEAN DEFAULT FALSE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'completed', -- 'pending', 'approved', 'completed', 'rejected'
  
  change_reason TEXT,
  change_impact TEXT
);

CREATE INDEX idx_audit_config_id ON config_audit_log(config_id);
CREATE INDEX idx_audit_changed_by ON config_audit_log(changed_by);
CREATE INDEX idx_audit_changed_at ON config_audit_log(changed_at);
CREATE INDEX idx_audit_payroll_affecting ON config_audit_log(is_payroll_affecting);

-- ============================================
-- 3. DEFAULT CONFIGURATIONS (INITIAL SEED)
-- ============================================
INSERT INTO system_config (
  config_key,
  config_name,
  config_description,
  config_value,
  data_type,
  approval_status,
  requires_dual_approval,
  created_by,
  is_active
) VALUES
  -- ATTENDANCE SETTINGS
  (
    'attendance.ontime_threshold',
    'On-Time Threshold (Minutes)',
    'Time in minutes before which check-in is marked as on-time (default 09:30)',
    '{"hours": 9, "minutes": 30, "description": "09:30 is on-time"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'attendance.late_threshold',
    'Late Threshold (Minutes)',
    'Time in minutes after which check-in is marked as late (default 09:45)',
    '{"hours": 9, "minutes": 45, "description": "09:45+ is late"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'attendance.exit_anomaly_threshold',
    'Exit Anomaly Threshold (Evening)',
    'Time after which missing check-out triggers anomaly (default 18:30)',
    '{"hours": 18, "minutes": 30, "description": "6:30 PM exit anomaly threshold"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'attendance.debounce_window_seconds',
    'RFID Debounce Window (Seconds)',
    'Ignore duplicate RFID scans within this window (default 60 seconds)',
    '{"value": 60, "unit": "seconds"}'::JSONB,
    'json',
    'active',
    FALSE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'attendance.missing_exit_grace_period',
    'Missing Exit Grace Period (Hours)',
    'Employee can submit missing exit request until this time (default 21:00)',
    '{"hours": 21, "minutes": 0, "description": "9:00 PM grace period"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'attendance.auto_lop_on_unresolved_anomaly',
    'Auto LOP on Unresolved Anomaly (Days)',
    'Auto-apply this many LOP days if anomaly unresolved (default 0.5)',
    '{"value": 0.5, "unit": "days"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  
  -- TIMESHEET SETTINGS
  (
    'timesheet.hard_cutoff_time',
    'Timesheet Hard Cutoff (Evening)',
    'Hard cutoff time for timesheet entry (default 20:00)',
    '{"hours": 20, "minutes": 0, "description": "8:00 PM hard cutoff"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'timesheet.auto_flag_time',
    'Timesheet Auto-Flag Time (Evening)',
    'Auto-flag timesheet after this time (default 20:05)',
    '{"hours": 20, "minutes": 5, "description": "8:05 PM auto-flag"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'timesheet.employee_alert_time',
    'Timesheet Employee Alert Time (Evening)',
    'Alert employee at this time (default 20:10)',
    '{"hours": 20, "minutes": 10, "description": "8:10 PM employee alert"}'::JSONB,
    'json',
    'active',
    FALSE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'timesheet.manager_escalation_time',
    'Timesheet Manager Escalation Time (Next Day Morning)',
    'Manager escalation time next day (default 09:00)',
    '{"hours": 9, "minutes": 0, "description": "9:00 AM next day escalation"}'::JSONB,
    'json',
    'active',
    FALSE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  
  -- LEAVE SETTINGS
  (
    'leave.casual_leaves_annual',
    'Casual Leaves Per Annum',
    'Number of casual leaves per year',
    '{"value": 10, "unit": "days"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'leave.sick_leaves_annual',
    'Sick Leaves Per Annum',
    'Number of sick leaves per year',
    '{"value": 8, "unit": "days"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'leave.earned_leaves_annual',
    'Earned Leaves Per Annum',
    'Number of earned leaves per year',
    '{"value": 15, "unit": "days"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  
  -- PAYROLL SETTINGS
  (
    'payroll.cycle_start_date',
    'Payroll Cycle Start Date',
    'Day of month when payroll cycle starts (default 1st)',
    '{"value": 1, "unit": "day of month"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'payroll.cycle_end_date',
    'Payroll Cycle End Date',
    'Day of month when payroll cycle ends (default 30th)',
    '{"value": 30, "unit": "day of month"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'payroll.halt_on_attendance_anomalies',
    'Halt Payroll on Attendance Anomalies',
    'Block payroll processing if unresolved attendance anomalies exist',
    '{"value": true, "description": "Payroll blocked until anomalies resolved"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  ),
  (
    'payroll.lop_deduction_percentage',
    'LOP Deduction Percentage',
    'Percentage of daily salary to deduct for LOP day (default 100%)',
    '{"value": 100, "unit": "percent"}'::JSONB,
    'json',
    'active',
    TRUE,
    '00000000-0000-0000-0000-000000000001',
    TRUE
  );

-- ============================================
-- 4. GRANT PERMISSIONS
-- ============================================
-- System config should only be accessible by admin/hr/finance roles
-- (Configure Row Level Security in Supabase Console)

COMMIT;
