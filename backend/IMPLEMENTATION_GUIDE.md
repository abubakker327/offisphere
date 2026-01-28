# CRITICAL IMPLEMENTATION GUIDE
## Payroll Coupling + Attendance Anomaly Engine

**Status:** 🔴 CRITICAL - Phase 1 Complete  
**Date:** January 28, 2026  
**Version:** 1.0

---

## WHAT HAS BEEN IMPLEMENTED

### ✅ DATABASE LAYER

#### 1. System Configuration Governance (`01_config_governance.sql`)
- **system_config** table - Centralized configuration with dual approval workflow
- **config_audit_log** table - Complete audit trail for all config changes
- Pre-seeded default configs for:
  - Attendance thresholds (09:30 on-time, 09:45 late)
  - Exit anomaly threshold (18:30 / 6:30 PM)
  - RFID debounce window (60 seconds)
  - Missing checkout grace period (21:00 / 9:00 PM)
  - Auto-LOP on unresolved anomalies (0.5 days)
  - Timesheet cutoff times (20:00, 20:05, 20:10)
  - Leave entitlements (CL: 10, SL: 8, EL: 15)
  - Payroll cycle dates and LOP deduction percentage

#### 2. Attendance Anomaly Engine (`02_attendance_anomaly.sql`)
- **rfid_logs** - RFID hardware device scan logs
  - Employee ID, timestamp, device info
  - Debounce tracking (duplicate scan detection)
  - User mapping
  - Raw data storage for audit

- **attendance_anomalies** - Anomaly tracking
  - Anomaly types: missing_checkout, missing_checkin, duplicate_scan, suspicious_pattern
  - Severity levels: low, medium, high, critical
  - Workflow status: open → pending_approval → approved/rejected/resolved
  - Employee response, manager notes, resolution tracking
  - LOP days applied for unresolved anomalies

- **missing_checkout_requests** - Grace period requests
  - Employees can request checkout until 21:00 same day
  - Manager approval workflow
  - Status tracking: pending → approved/rejected/expired

- **escalation_events** - Multi-module escalation system
  - Used by Attendance, Timesheet, Tasks
  - Escalation levels: 1=employee, 2=manager, 3=admin
  - Notification tracking
  - Resolution audit trail

- **attendance_rules_log** - Rule engine audit
  - Tracks all rule evaluations
  - Documents which rules fired and results
  - Configuration values used at time of check

#### 3. Payroll Coupling (`03_payroll_coupling.sql`)
- **payroll_aggregation_source** - Attendance → Payroll bridge
  - Aggregates: present, absent, late, anomaly days
  - Leave aggregation: CL, SL, EL usage
  - LOP calculation (both calculated and manual)
  - Timesheet completeness tracking
  - Blocking flags for critical anomalies

- **payroll_validation_results** - Validation checks
  - Attendance anomalies check
  - Timesheet completion check
  - Leave balance check
  - Data completeness check
  - Blocking vs. warning classification

- **payroll_sign_offs** - Dual approval workflow
  - HR sign-off (Step 1)
  - Finance sign-off (Step 2)
  - Finalization only after both approve

- **payslips** - Payslip generation & watermarking
  - PDF storage paths
  - Watermarking (DRAFT, CONFIDENTIAL, FINALIZED)
  - Digital signature capability
  - Employee access tracking

- **payroll_halt_log** - Payroll holds audit
  - Reason for halt
  - Who initiated, when, resolution status
  - Audit trail for compliance

- **config_payroll_impact** - Config change risk assessment
  - Links config changes to affected payroll runs
  - Salary impact calculations
  - Risk level assessment

---

### ✅ SERVICE LAYER

#### 1. Attendance Automation Engine (`attendanceAutomationEngine.js`)

**Core Functions:**

1. **loadConfig()** - Dynamic configuration loader with 5-min cache
   ```
   Loads system_config and normalizes to object
   Uses defaults if config table unavailable
   ```

2. **ingestRfidScan(rfidData)** - RFID hardware integration
   ```
   Input: { employee_id, scan_timestamp, device_id, device_location, raw_data }
   
   Process:
   ├─ Insert RFID log
   ├─ Debounce check (60s window)
   ├─ Map employee_id → user_id
   ├─ Process attendance check-in/check-out
   └─ Return { status, rfid_log_id, attendance_result }
   
   Handles: First scan = check-in, subsequent scan = check-out
   ```

3. **evaluateAttendanceRules(userId, attendanceDateStr)** - Rule engine
   ```
   Rules evaluated:
   ├─ On-time check (before 09:30 minutes)
   ├─ Late check (09:30-09:45)
   ├─ Very late check (after 09:45 = absent)
   └─ Missing checkout check (after 18:30 OR past attendance date)
   
   Returns: { determined_status, anomaly_type, rules_fired }
   Status: present, late, absent, anomaly
   ```

4. **createAttendanceAnomaly(userId, attendanceId, attendanceDateStr, anomalyType, details)** - Anomaly workflow trigger
   ```
   Creates attendance_anomalies record
   Triggers escalation_events for manager review
   Status: open (waiting for manager approval)
   ```

5. **submitMissingCheckoutRequest(userId, attendanceId, attendanceDateStr, requestedCheckoutTime)** - Grace period request
   ```
   Grace period: Until 21:00 same day
   Creates missing_checkout_requests record
   Triggers manager escalation
   Enforces time limit
   ```

6. **applyAutoLopForUnresolvedAnomalies()** - Daily scheduled LOP
   ```
   Runs daily at end of day
   Finds unresolved anomalies from YESTERDAY
   Applies 0.5 days LOP if unresolved by manager deadline
   Updates anomaly status to "resolved_auto_lop"
   ```

---

#### 2. Payroll Coupling Engine (`payrollCouplingEngine.js`)

**Core Functions:**

1. **validatePayrollRun(payrollRunId)** - Payroll validation gate
   ```
   Runs for each employee in payroll run
   Validation checks:
   ├─ Attendance anomalies (blocking if critical)
   ├─ Timesheet pending (warning)
   ├─ Leave balance check (info)
   └─ Attendance data completeness (warning if none)
   
   Result: BLOCKED if critical anomalies, VALIDATED otherwise
   Updates payroll_runs.validation_status
   ```

2. **performEmployeePayrollValidation(userId, periodStart, periodEnd, payrollRunId)** - Individual checks
   ```
   Returns: { validation_checks[], has_blocking_issues }
   
   Blocking conditions:
   ├─ Unresolved HIGH/CRITICAL attendance anomalies
   └─ Payroll halt check
   
   Warnings (non-blocking):
   ├─ Pending timesheets
   └─ No attendance data
   ```

3. **aggregatePayrollSourceData(payrollRunId, userId, periodStart, periodEnd)** - Data aggregation
   ```
   Aggregates from:
   ├─ Attendance (present, absent, late, with_anomalies)
   ├─ Approved Leaves (CL, SL, EL days used)
   ├─ LOP applied (from anomalies + manual)
   ├─ Timesheet (hours, pending count)
   └─ Anomalies (count, unresolved)
   
   Creates payroll_aggregation_source record
   Flags blocking anomalies for payroll processor
   ```

4. **haltPayrollForAnomalies(payrollRunId, userId, haltReason, details)** - Payroll block
   ```
   Creates payroll_halt_log record
   Marks payroll_runs.is_blocked_for_anomalies = true
   Updates payroll_runs.blocked_reason
   ```

5. **approvePayrollHR(payrollRunId, hrUserId, notes)** - Step 1: HR approval
   ```
   Records HR sign-off in payroll_sign_offs
   Status becomes "partial" (waiting for finance)
   ```

6. **approvePayrollFinance(payrollRunId, financeUserId, notes)** - Step 2: Finance approval
   ```
   Records Finance sign-off in payroll_sign_offs
   If HR already approved: Status becomes "complete"
   Marks payroll_runs.status = "approved"
   Ready for payslip generation
   ```

---

### ✅ API LAYER

#### 1. Attendance Anomaly Routes (`attendanceAnomalyRoutes.js`)

**New Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/attendance/rfid/ingest` | None | RFID hardware integration |
| GET | `/api/attendance/anomalies` | User | List anomalies (role-filtered) |
| GET | `/api/attendance/anomalies/:id` | User | Get anomaly detail |
| POST | `/api/attendance/missing-checkout/request` | Employee | Submit missing checkout request |
| GET | `/api/attendance/missing-checkout/requests` | User | List requests (role-filtered) |
| PATCH | `/api/attendance/missing-checkout/requests/:id/approve` | Manager | Manager approve request |
| PATCH | `/api/attendance/missing-checkout/requests/:id/reject` | Manager | Manager reject request |
| POST | `/api/attendance/evaluate-rules` | Manager | Manual rule evaluation |
| POST | `/api/attendance/apply-auto-lop` | Admin | Manual LOP application |
| GET | `/api/attendance/rfid-logs` | Admin | View RFID logs (debug) |

---

#### 2. Enhanced Payroll Routes (`payrollEnhancedRoutes.js`)

**New Endpoints:**

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/payroll/runs` | Manager | Create payroll run |
| POST | `/api/payroll/runs/:id/validate` | Manager | Validate payroll |
| GET | `/api/payroll/runs/:id/validation-results` | Manager | View validation results |
| POST | `/api/payroll/runs/:id/aggregate` | Manager | Aggregate source data |
| GET | `/api/payroll/runs` | All | List payroll runs |
| GET | `/api/payroll/runs/:id` | All | Get payroll detail with items |
| PATCH | `/api/payroll/runs/:id/approve/hr` | Manager | HR approval (Step 1) |
| PATCH | `/api/payroll/runs/:id/approve/finance` | Admin | Finance approval (Step 2) |
| GET | `/api/payroll/runs/:id/sign-offs` | All | Get sign-off status |
| GET | `/api/payroll/runs/:id/holds` | Manager | View active holds |
| PATCH | `/api/payroll/runs/:id/holds/:hold_id/resolve` | Admin | Resolve hold |

---

## WORKFLOW EXAMPLES

### Example 1: Complete Attendance Anomaly Workflow

```
1. Employee arrives late (09:50 AM)
   → RFID scan processed
   → attendanceEngine.ingestRfidScan()
   → Attendance record created with check_in = 09:50
   
2. Attendance rules evaluated (daily batch job)
   → evaluateAttendanceRules()
   → Rule: late_check fires (after 09:45)
   → Status determined: "present" but flagged
   
3. Employee forgets to check out at 18:30
   → No checkout recorded
   → Next day at 09:00, rule engine finds missing_checkout
   → createAttendanceAnomaly("missing_checkout")
   → Escalation created → Manager notified
   
4. Same day, employee submits request (before 21:00)
   → submitMissingCheckoutRequest(attendanceId, "19:00")
   → Manager gets notification
   
5. Manager approves (next day morning)
   → PATCH /api/attendance/missing-checkout/requests/:id/approve
   → Anomaly resolved as "resolved_manual"
   → No LOP applied
   
6. If manager doesn't respond by EOD
   → applyAutoLopForUnresolvedAnomalies() (daily)
   → 0.5 days LOP applied automatically
   → Anomaly status: "resolved_auto_lop"
```

### Example 2: Complete Payroll Processing Workflow

```
1. HR creates payroll run
   → POST /api/payroll/runs?period_start=2026-01-01&period_end=2026-01-31
   → Status: "draft", validation_status: "pending"

2. HR validates payroll
   → POST /api/payroll/runs/:id/validate
   → Validates each employee:
     - Attendance anomalies? (blocking if critical)
     - Timesheets pending? (warning)
     - Leave balance? (info)
   → If blocking anomalies exist:
     - validation_status = "blocked"
     - is_blocked_for_anomalies = true
     - blocked_reason = "Attendance anomalies..."
   → Else:
     - validation_status = "validated"

3. Data aggregation
   → POST /api/payroll/runs/:id/aggregate
   → For each employee:
     - Count: days_present, days_absent, days_late
     - Sum: approved_leave_days, lop_days_calculated
     - Check: timesheet_pending_approval
   → Creates payroll_aggregation_source records

4. HR submits approval (Step 1)
   → PATCH /api/payroll/runs/:id/approve/hr
   → Records HR user, timestamp, notes
   → sign_off_status = "partial" (waiting for finance)

5. Finance submits approval (Step 2)
   → PATCH /api/payroll/runs/:id/approve/finance
   → If HR already approved:
     - sign_off_status = "complete"
     - payroll_runs.status = "approved"
     - Dual approval requirement satisfied

6. Payslip generation (external process)
   → Reads payroll_runs.status = "approved"
   → Generates PDF with watermark "FINALIZED"
   → Records payslips table
   → Ready for employee download
```

---

## MIGRATION STEPS (DO THIS IN SUPABASE CONSOLE)

### Step 1: Run SQL Migrations

Run in Supabase SQL Editor (in order):

```sql
-- 1. Config governance tables
\i 01_config_governance.sql

-- 2. Attendance anomaly tables
\i 02_attendance_anomaly.sql

-- 3. Payroll coupling tables
\i 03_payroll_coupling.sql
```

### Step 2: Verify Tables Created

```sql
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
```

Expected tables:
- system_config ✓
- config_audit_log ✓
- rfid_logs ✓
- attendance_anomalies ✓
- missing_checkout_requests ✓
- escalation_events ✓
- attendance_rules_log ✓
- payroll_aggregation_source ✓
- payroll_validation_results ✓
- payroll_sign_offs ✓
- payslips ✓
- payroll_halt_log ✓
- config_payroll_impact ✓

### Step 3: Verify Default Configs

```sql
SELECT config_key, config_value FROM system_config ORDER BY config_key;
```

Should show 16 default configurations.

---

## TESTING CHECKLIST

### Attendance Engine

- [ ] RFID ingestion endpoint receives scan
- [ ] Debounce logic marks duplicate scans within 60s
- [ ] First scan = check-in, second scan = check-out
- [ ] Employee ID maps to user_id
- [ ] Attendance rules evaluate correctly
  - [ ] On-time (before 09:30)
  - [ ] Late (09:30-09:45)
  - [ ] Very late (after 09:45)
  - [ ] Missing checkout (no checkout after 18:30)
- [ ] Anomalies create escalation events
- [ ] Missing checkout request validates grace period (until 21:00)
- [ ] Manager approval resolves anomaly
- [ ] Auto-LOP applies next day if unresolved

### Payroll Engine

- [ ] Payroll validation blocks on critical anomalies
- [ ] Validation results saved correctly
- [ ] Data aggregation sums correctly
  - [ ] Present/absent/late days
  - [ ] Leave usage by type
  - [ ] LOP calculation
  - [ ] Timesheet pending count
- [ ] HR approval records sign-off
- [ ] Finance approval records sign-off
- [ ] Dual approval required before status="approved"
- [ ] Payroll holds prevent processing

### Config System

- [ ] Config values load from database
- [ ] Cache expires after 5 minutes
- [ ] Defaults used if config table unavailable
- [ ] Config audit log tracks all changes

---

## NEXT PHASES (NOT YET IMPLEMENTED)

### Phase 2: Timesheet Escalation (1-2 weeks)
- [ ] Scheduled task at 8:00 PM cutoff
- [ ] Auto-flag at 8:05 PM
- [ ] Employee alert at 8:10 PM
- [ ] Manager escalation next day 9:00 AM
- [ ] Read-only enforcement for past days

### Phase 3: Task Overdue Automation (1 week)
- [ ] Daily 8:30 AM overdue scan
- [ ] Daily 9:00 AM reminders
- [ ] Escalation after 2 reopens
- [ ] Auto-admin assignment on 3rd reopen

### Phase 4: Config Governance UI (1-2 weeks)
- [ ] System config management page
- [ ] Dual approval workflow UI
- [ ] Config change history/audit view
- [ ] Risk assessment before changes

---

## ENVIRONMENT VARIABLES

Add to `.env`:

```bash
# Scheduler (for Phase 2+)
SCHEDULER_ENABLED=true
SCHEDULER_TZ=Asia/Kolkata

# Config defaults
ATTENDANCE_ONTIME_MINUTES=570  # 09:30
ATTENDANCE_LATE_MINUTES=585    # 09:45
ATTENDANCE_EXIT_ANOMALY_HOUR=18
ATTENDANCE_EXIT_ANOMALY_MIN=30
ATTENDANCE_DEBOUNCE_SECONDS=60
```

---

## DEPLOYMENT NOTES

1. **Database**: Run migrations in Supabase console
2. **Backend**: Deploy new services and routes
3. **Frontend**: (Phase 2) Add anomaly/payroll UI pages
4. **Scheduler**: (Phase 2) Configure Bull/node-cron for daily jobs
5. **Monitoring**: Alert on payroll holds, critical anomalies

---

## CRITICAL SUCCESS FACTORS

✅ **Implemented:**
- RFID integration ready (hardware can start sending scans)
- Attendance automation (rules, anomalies, workflows)
- Payroll validation & coupling (blocks payroll on issues)
- Dual approval enforcement (HR + Finance required)
- Complete audit trails (config_audit_log, rules_log, sign_offs)

⚠️ **Requires:**
- Database migrations run in Supabase
- Backend services deployed
- Testing of RFID format with hardware team
- Frontend UI for anomaly/payroll workflows
- Scheduled job configuration

---

**Ready for implementation!** 🚀

Contact for questions on:
- RFID hardware format specifications
- Hardware device endpoints
- Scheduled job configuration (Bull/Cron)
- Frontend UI requirements
