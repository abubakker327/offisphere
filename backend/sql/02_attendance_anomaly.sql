-- ============================================
-- ATTENDANCE ANOMALY & AUTOMATION TABLES
-- RFID ingestion, anomaly tracking, workflows
-- ============================================

-- ============================================
-- 1. RFID INGESTION LOG (Hardware Device Integration)
-- ============================================
CREATE TABLE IF NOT EXISTS rfid_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- RFID device scan data
  employee_id VARCHAR(255) NOT NULL, -- Could be card number, badge ID
  scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  device_id VARCHAR(255), -- Which RFID reader (e.g., "gate_entrance_01")
  device_location VARCHAR(255), -- Physical location (e.g., "Main Entrance")
  
  -- Processing
  is_processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  -- Debounce check (to ignore duplicate scans within 60s window)
  is_duplicate BOOLEAN DEFAULT FALSE,
  duplicate_of_id UUID REFERENCES rfid_logs(id) ON DELETE SET NULL,
  
  -- Linked to actual user (if found)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Raw data from RFID device
  raw_data JSONB, -- Store complete payload for audit
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rfid_employee_id ON rfid_logs(employee_id);
CREATE INDEX idx_rfid_scan_timestamp ON rfid_logs(scan_timestamp);
CREATE INDEX idx_rfid_user_id ON rfid_logs(user_id);
CREATE INDEX idx_rfid_is_processed ON rfid_logs(is_processed);
CREATE INDEX idx_rfid_is_duplicate ON rfid_logs(is_duplicate);
CREATE INDEX idx_rfid_device_id ON rfid_logs(device_id);

-- ============================================
-- 2. ATTENDANCE ANOMALIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to attendance record
  attendance_id BIGINT REFERENCES attendance(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  
  -- Anomaly types
  anomaly_type VARCHAR(100) NOT NULL, -- 'missing_checkout', 'missing_checkin', 'duplicate_scan', 'suspicious_pattern', 'no_show'
  anomaly_severity VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  
  -- Description and details
  description TEXT,
  details JSONB, -- Flexible field for additional context
  
  -- Status and resolution
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'pending_approval', 'approved', 'rejected', 'resolved_auto_lop', 'resolved_manual'
  
  -- Workflow tracking
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  flagged_by UUID, -- User who flagged (if manual)
  flagged_at TIMESTAMP WITH TIME ZONE,
  
  -- Employee response
  employee_response TEXT, -- Employee's explanation
  employee_response_at TIMESTAMP WITH TIME ZONE,
  
  -- Manager approval
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  manager_notes TEXT,
  
  -- Resolution
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_type VARCHAR(100), -- 'approved_as_is', 'manual_correction', 'auto_lop_applied', 'manual_exit_approved'
  resolution_notes TEXT,
  
  -- LOP impact
  lop_days_applied DECIMAL(5, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anomaly_user_id ON attendance_anomalies(user_id);
CREATE INDEX idx_anomaly_attendance_date ON attendance_anomalies(attendance_date);
CREATE INDEX idx_anomaly_status ON attendance_anomalies(status);
CREATE INDEX idx_anomaly_type ON attendance_anomalies(anomaly_type);
CREATE INDEX idx_anomaly_severity ON attendance_anomalies(anomaly_severity);
CREATE INDEX idx_anomaly_detected_at ON attendance_anomalies(detected_at);

-- ============================================
-- 3. MISSING CHECKOUT REQUEST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS missing_checkout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  attendance_id BIGINT NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  anomaly_id UUID NOT NULL REFERENCES attendance_anomalies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE,
  requested_checkout_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  -- Request status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  
  -- Workflow
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  
  -- Grace period (usually until 21:00 same day)
  grace_period_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_missing_checkout_user_id ON missing_checkout_requests(user_id);
CREATE INDEX idx_missing_checkout_status ON missing_checkout_requests(status);
CREATE INDEX idx_missing_checkout_attendance_date ON missing_checkout_requests(attendance_date);
CREATE INDEX idx_missing_checkout_requested_at ON missing_checkout_requests(requested_at);

-- ============================================
-- 4. ESCALATION EVENTS TABLE (Multi-Module)
-- Used by Attendance, Timesheet, Tasks
-- ============================================
CREATE TABLE IF NOT EXISTS escalation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Escalation context
  event_type VARCHAR(100) NOT NULL, -- 'attendance_anomaly', 'timesheet_pending', 'task_overdue', 'task_reopen'
  entity_type VARCHAR(100) NOT NULL, -- 'attendance', 'timesheet', 'task'
  entity_id UUID NOT NULL, -- attendance_id, timesheet_id, task_id
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Escalation details
  escalation_level INT DEFAULT 1, -- 1=employee, 2=manager, 3=admin
  escalation_target_role VARCHAR(100), -- 'employee', 'manager', 'admin'
  
  -- Timeline
  escalation_triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_escalation_time TIMESTAMP WITH TIME ZONE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'escalated', 'resolved', 'acknowledged'
  
  -- Notification
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Context
  reason TEXT,
  details JSONB,
  
  -- Resolution
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_escalation_event_type ON escalation_events(event_type);
CREATE INDEX idx_escalation_entity_id ON escalation_events(entity_id);
CREATE INDEX idx_escalation_user_id ON escalation_events(user_id);
CREATE INDEX idx_escalation_status ON escalation_events(status);
CREATE INDEX idx_escalation_scheduled_time ON escalation_events(scheduled_escalation_time);
CREATE INDEX idx_escalation_target_role ON escalation_events(escalation_target_role);

-- ============================================
-- 5. ATTENDANCE RULES ENGINE LOG
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_rules_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  
  -- Rule evaluation
  rule_name VARCHAR(255), -- e.g., 'ontime_check', 'late_check', 'missing_checkout'
  rule_result VARCHAR(50), -- 'pass', 'flag', 'anomaly'
  rule_reason TEXT,
  
  -- Checks
  check_in_time TIMESTAMP WITH TIME ZONE,
  checkout_time TIMESTAMP WITH TIME ZONE,
  
  -- Configuration values used at time of check
  ontime_threshold_minutes INT,
  late_threshold_minutes INT,
  
  -- Resulting status determination
  determined_status VARCHAR(50), -- 'present', 'late', 'absent', 'on_leave', 'anomaly'
  
  rule_engine_version VARCHAR(50), -- Track which version of rules ran
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rules_user_date ON attendance_rules_log(user_id, attendance_date);
CREATE INDEX idx_rules_rule_result ON attendance_rules_log(rule_result);

-- ============================================
-- 6. ADD COLUMNS TO EXISTING ATTENDANCE TABLE
-- (These columns enhance the existing attendance table)
-- ============================================
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS anomaly_flagged BOOLEAN DEFAULT FALSE;
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS anomaly_id UUID REFERENCES attendance_anomalies(id);
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS rfid_scan_id UUID REFERENCES rfid_logs(id);
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_manual_entry BOOLEAN DEFAULT FALSE;
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS manual_entry_by UUID REFERENCES users(id);
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS lop_applied DECIMAL(5, 2) DEFAULT 0;
-- ALTER TABLE attendance ADD COLUMN IF NOT EXISTS has_unresolved_anomaly BOOLEAN DEFAULT FALSE;

COMMIT;
