#!/bin/bash

# Migration Checklist for Offisphere Payroll Coupling + Attendance Automation
# Run each SQL file in Supabase console in the order specified

echo "🚀 OFFISPHERE CRITICAL MIGRATIONS"
echo "================================="
echo ""
echo "⚠️  IMPORTANT:"
echo "- Run these in Supabase SQL Editor (NOT in local psql)"
echo "- Run in THIS exact order"
echo "- Keep logs/screenshots for audit trail"
echo ""
echo "================================="
echo ""

echo "STEP 1: System Configuration Governance"
echo "File: backend/sql/01_config_governance.sql"
echo "Creates: system_config, config_audit_log"
echo "Action: Copy SQL file → Paste in Supabase → Run"
echo "Expected: 1 table created, 16 configs seeded"
echo ""
read -p "✓ Completed Step 1? (y/n) " step1

echo ""
echo "STEP 2: Attendance Anomaly Tables"
echo "File: backend/sql/02_attendance_anomaly.sql"
echo "Creates: rfid_logs, attendance_anomalies, missing_checkout_requests,"
echo "         escalation_events, attendance_rules_log"
echo "Action: Copy SQL file → Paste in Supabase → Run"
echo "Expected: 5 tables created"
echo ""
read -p "✓ Completed Step 2? (y/n) " step2

echo ""
echo "STEP 3: Payroll Coupling Tables"
echo "File: backend/sql/03_payroll_coupling.sql"
echo "Creates: payroll_aggregation_source, payroll_validation_results,"
echo "         payroll_sign_offs, payslips, payroll_halt_log,"
echo "         config_payroll_impact"
echo "Action: Copy SQL file → Paste in Supabase → Run"
echo "Expected: 6 tables created"
echo ""
read -p "✓ Completed Step 3? (y/n) " step3

echo ""
echo "VERIFICATION QUERIES"
echo "===================="
echo ""
echo "Run these queries in Supabase to verify:"
echo ""
echo "1. Check all tables created:"
echo "   SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;"
echo ""
echo "2. Verify default configs:"
echo "   SELECT COUNT(*) FROM system_config WHERE is_active = true;"
echo "   Expected: 16"
echo ""
echo "3. Check system_config structure:"
echo "   SELECT config_key, data_type, approval_status FROM system_config LIMIT 5;"
echo ""
echo "4. Check escalation_events table:"
echo "   SELECT column_name FROM information_schema.columns WHERE table_name='escalation_events';"
echo ""

echo ""
echo "BACKEND DEPLOYMENT"
echo "=================="
echo ""
echo "After SQL migrations, deploy backend:"
echo ""
echo "1. Copy service files:"
echo "   cp backend/src/services/attendanceAutomationEngine.js <running-backend>/src/services/"
echo "   cp backend/src/services/payrollCouplingEngine.js <running-backend>/src/services/"
echo ""
echo "2. Copy route files:"
echo "   cp backend/src/routes/attendanceAnomalyRoutes.js <running-backend>/src/routes/"
echo "   cp backend/src/routes/payrollEnhancedRoutes.js <running-backend>/src/routes/"
echo ""
echo "3. Update main index:"
echo "   Update backend/src/index.js (already modified)"
echo ""
echo "4. Restart backend:"
echo "   cd backend && npm run dev"
echo ""

echo ""
echo "API ENDPOINTS AVAILABLE"
echo "======================"
echo ""
echo "Attendance Anomaly:"
echo "  POST   /api/attendance/rfid/ingest"
echo "  GET    /api/attendance/anomalies"
echo "  POST   /api/attendance/missing-checkout/request"
echo "  PATCH  /api/attendance/missing-checkout/requests/:id/approve"
echo ""
echo "Payroll Coupling:"
echo "  POST   /api/payroll/runs/:id/validate"
echo "  POST   /api/payroll/runs/:id/aggregate"
echo "  PATCH  /api/payroll/runs/:id/approve/hr"
echo "  PATCH  /api/payroll/runs/:id/approve/finance"
echo ""

echo ""
echo "TESTING"
echo "======="
echo ""
echo "1. Test RFID ingestion:"
curl -X POST http://localhost:5000/api/attendance/rfid/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "scan_timestamp": "2026-01-28T09:30:00Z",
    "device_id": "gate_main",
    "device_location": "Main Entrance",
    "raw_data": {"signal_strength": -45}
  }'
echo ""

echo ""
echo "2. Test payroll validation:"
echo "   Make a payroll run first, then:"
curl -X POST http://localhost:5000/api/payroll/runs/[payroll-id]/validate \
  -H "Authorization: Bearer [your-token]"
echo ""

echo ""
echo "✅ MIGRATION COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Review IMPLEMENTATION_GUIDE.md for complete documentation"
echo "2. Test RFID integration with hardware team"
echo "3. Set up scheduled jobs (Phase 2)"
echo "4. Build frontend UI for anomaly/payroll workflows"
echo ""
