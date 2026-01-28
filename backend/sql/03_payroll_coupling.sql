-- ============================================
-- PAYROLL COUPLING & VALIDATION TABLES
-- Links payroll to attendance, leaves, anomalies
-- ============================================

-- ============================================
-- 1. ENHANCE PAYROLL_RUNS TABLE
-- ============================================
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'pending';
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS has_attendance_anomalies BOOLEAN DEFAULT FALSE;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS anomalies_count INT DEFAULT 0;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS is_blocked_for_anomalies BOOLEAN DEFAULT FALSE;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS approved_by_finance UUID REFERENCES users(id);
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS dual_approval_required BOOLEAN DEFAULT TRUE;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS hr_approval_by UUID REFERENCES users(id);
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS hr_approval_at TIMESTAMP WITH TIME ZONE;
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS finance_approval_by UUID REFERENCES users(id);
-- ALTER TABLE payroll_runs ADD COLUMN IF NOT EXISTS finance_approval_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 2. PAYROLL AGGREGATION SOURCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_aggregation_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Aggregation period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- ===============================
  -- ATTENDANCE AGGREGATION
  -- ===============================
  total_working_days INT DEFAULT 0,
  days_present INT DEFAULT 0,
  days_absent INT DEFAULT 0,
  days_late INT DEFAULT 0,
  
  -- Anomalies
  days_with_anomalies INT DEFAULT 0,
  unresolved_anomalies_count INT DEFAULT 0,
  
  -- ===============================
  -- LEAVE AGGREGATION
  -- ===============================
  approved_leave_days DECIMAL(5, 2) DEFAULT 0,
  cl_used DECIMAL(5, 2) DEFAULT 0,
  sl_used DECIMAL(5, 2) DEFAULT 0,
  el_used DECIMAL(5, 2) DEFAULT 0,
  
  -- ===============================
  -- LOP (Loss of Pay) CALCULATION
  -- ===============================
  lop_days_calculated DECIMAL(5, 2) DEFAULT 0, -- From anomalies
  lop_days_manual DECIMAL(5, 2) DEFAULT 0, -- Manually added
  lop_days_total DECIMAL(5, 2) DEFAULT 0,
  
  -- ===============================
  -- TIMESHEET
  -- ===============================
  timesheet_entries_submitted INT DEFAULT 0,
  timesheet_hours_total DECIMAL(10, 2) DEFAULT 0,
  timesheet_pending_approval INT DEFAULT 0,
  
  -- ===============================
  -- VALIDATION FLAGS
  -- ===============================
  attendance_data_complete BOOLEAN DEFAULT TRUE,
  leave_data_complete BOOLEAN DEFAULT TRUE,
  timesheet_data_complete BOOLEAN DEFAULT TRUE,
  
  has_blocking_anomalies BOOLEAN DEFAULT FALSE,
  blocking_anomalies_reason TEXT,
  
  -- ===============================
  -- AUDIT
  -- ===============================
  aggregated_at TIMESTAMP WITH TIME ZONE,
  aggregated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_agg_payroll_run_id ON payroll_aggregation_source(payroll_run_id);
CREATE INDEX idx_agg_user_id ON payroll_aggregation_source(user_id);
CREATE INDEX idx_agg_period ON payroll_aggregation_source(period_start, period_end);
CREATE INDEX idx_agg_has_blocking ON payroll_aggregation_source(has_blocking_anomalies);

-- ============================================
-- 3. PAYROLL ITEMS (DETAILED CALCULATION)
-- ============================================
-- Enhance existing payroll_items table with calculation breakdown
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS aggregation_source_id UUID REFERENCES payroll_aggregation_source(id);
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS base_salary_daily DECIMAL(15, 2);
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS lop_deduction DECIMAL(15, 2) DEFAULT 0;
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS leave_deduction DECIMAL(15, 2) DEFAULT 0;
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS other_deductions DECIMAL(15, 2) DEFAULT 0;
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS bonus DECIMAL(15, 2) DEFAULT 0;
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS allowances DECIMAL(15, 2) DEFAULT 0;
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS gross_salary DECIMAL(15, 2);
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS net_pay DECIMAL(15, 2);
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS calculation_notes TEXT;
-- ALTER TABLE payroll_items ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 4. PAYROLL VALIDATION RESULTS
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  payroll_item_id UUID NOT NULL REFERENCES payroll_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Validation checks
  check_name VARCHAR(255), -- e.g., 'attendance_anomalies', 'missing_timesheets', 'leave_balance'
  check_result VARCHAR(50), -- 'pass', 'warning', 'fail'
  check_message TEXT,
  
  -- Severity
  is_blocking BOOLEAN DEFAULT FALSE, -- If true, blocks payroll approval
  is_warning BOOLEAN DEFAULT FALSE, -- Non-blocking warning
  
  -- Details
  details JSONB,
  
  validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_validation_payroll_run ON payroll_validation_results(payroll_run_id);
CREATE INDEX idx_validation_user_id ON payroll_validation_results(user_id);
CREATE INDEX idx_validation_check_result ON payroll_validation_results(check_result);
CREATE INDEX idx_validation_is_blocking ON payroll_validation_results(is_blocking);

-- ============================================
-- 5. PAYROLL SIGN-OFF & APPROVAL TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_sign_offs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  
  -- Dual sign-off
  hr_sign_off_by UUID REFERENCES users(id) ON DELETE SET NULL,
  hr_sign_off_at TIMESTAMP WITH TIME ZONE,
  hr_sign_off_notes TEXT,
  
  finance_sign_off_by UUID REFERENCES users(id) ON DELETE SET NULL,
  finance_sign_off_at TIMESTAMP WITH TIME ZONE,
  finance_sign_off_notes TEXT,
  
  -- Overall status
  sign_off_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'complete'
  
  -- If both signed
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_signoff_payroll_run ON payroll_sign_offs(payroll_run_id);
CREATE INDEX idx_signoff_status ON payroll_sign_offs(sign_off_status);

-- ============================================
-- 6. PAYSLIP GENERATION & WATERMARKING
-- ============================================
CREATE TABLE IF NOT EXISTS payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  payroll_item_id UUID NOT NULL REFERENCES payroll_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Payslip content
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  gross_salary DECIMAL(15, 2) NOT NULL,
  deductions DECIMAL(15, 2) NOT NULL,
  net_salary DECIMAL(15, 2) NOT NULL,
  
  -- Breakdown
  basic_salary DECIMAL(15, 2),
  allowances DECIMAL(15, 2),
  bonus DECIMAL(15, 2),
  lop_deduction DECIMAL(15, 2),
  leave_deduction DECIMAL(15, 2),
  other_deductions DECIMAL(15, 2),
  tax_deduction DECIMAL(15, 2),
  
  -- PDF storage
  pdf_file_path VARCHAR(500),
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  
  -- Watermarking
  watermark_text VARCHAR(255), -- "CONFIDENTIAL", "DRAFT", "FINALIZED"
  has_digital_signature BOOLEAN DEFAULT FALSE,
  signature_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Status
  payslip_status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'generated', 'signed', 'delivered'
  
  -- Employee access
  employee_viewed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payslip_payroll_run ON payslips(payroll_run_id);
CREATE INDEX idx_payslip_user_id ON payslips(user_id);
CREATE INDEX idx_payslip_status ON payslips(payslip_status);
CREATE INDEX idx_payslip_period ON payslips(period_start, period_end);

-- ============================================
-- 7. PAYROLL HALT REASONS LOG
-- ============================================
CREATE TABLE IF NOT EXISTS payroll_halt_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  payroll_run_id UUID NOT NULL REFERENCES payroll_runs(id) ON DELETE CASCADE,
  user_id UUID,
  
  -- Halt reason
  halt_reason VARCHAR(255) NOT NULL, -- 'attendance_anomalies', 'timesheet_incomplete', 'config_change', 'manual_hold'
  halt_description TEXT,
  
  -- Details
  affected_record_id UUID,
  affected_record_type VARCHAR(100),
  details JSONB,
  
  -- Who initiated halt
  halted_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  halted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Resolution
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'overridden'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_halt_payroll_run ON payroll_halt_log(payroll_run_id);
CREATE INDEX idx_halt_user_id ON payroll_halt_log(user_id);
CREATE INDEX idx_halt_reason ON payroll_halt_log(halt_reason);
CREATE INDEX idx_halt_status ON payroll_halt_log(status);

-- ============================================
-- 8. CONFIG CHANGE IMPACT ON PAYROLL
-- ============================================
CREATE TABLE IF NOT EXISTS config_payroll_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  config_audit_log_id UUID NOT NULL REFERENCES config_audit_log(id) ON DELETE CASCADE,
  
  -- Which payroll runs are affected
  affected_payroll_run_ids UUID[] DEFAULT '{}', -- Array of run IDs
  
  -- Impact analysis
  affected_employees INT DEFAULT 0,
  salary_impact_min DECIMAL(15, 2),
  salary_impact_max DECIMAL(15, 2),
  total_salary_impact DECIMAL(15, 2),
  
  -- Risk assessment
  risk_level VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
  risk_description TEXT,
  
  -- Action taken
  action_taken VARCHAR(255), -- 'payroll_halted', 'manual_review_required', 'processed_with_approval'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_config_impact_audit_log ON config_payroll_impact(config_audit_log_id);
CREATE INDEX idx_config_impact_risk ON config_payroll_impact(risk_level);

COMMIT;
