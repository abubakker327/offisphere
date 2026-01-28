# 📋 TIMESHEET ESCALATION - DEPLOYMENT GUIDE

**Phase 2 Implementation**  
**Date:** January 28, 2026  
**Status:** 🟢 Ready for Deployment

---

## 🎯 What's Included

### Timesheet Hard Cutoff Workflow
- **Level 1 (20:00):** Employee notification - "Submit timesheet now"
- **Level 2 (20:05):** Manager escalation - "Team member has 5 minutes left"
- **Level 3 (20:10):** Admin escalation - "Critical: Timesheet not submitted"
- **Hard Deadline (23:59):** Timesheet locked and unavailable

### Features
✅ Automatic incomplete timesheet detection  
✅ 3-level escalation workflow with configurable times  
✅ Escalation event integration with existing system  
✅ Submission audit trail for compliance  
✅ Manager approval workflow for late submissions  
✅ Real-time escalation tracking dashboard  

---

## 📁 Files Created

### 1. SQL Migration
- **File:** `backend/sql/04_timesheet_escalation.sql` (368 lines)
- **Tables:** 4 new tables + 16 indexes
- **Default Config:** Pre-seeded with 20:00, 20:05, 20:10 cutoffs

**Tables:**
```
timesheet_escalation_tracking
├─ Tracks escalation state (level, timestamps, status)
├─ Links to escalation_events table
└─ Audit trail for resolution

timesheet_escalation_history
├─ Complete action audit log
├─ Who triggered, when, why
└─ Hours submitted at each level

timesheet_cutoff_config
├─ Flexible cutoff times
├─ Notification settings (email, SMS)
├─ Behavior flags (auto-lock, require approval)
└─ Target roles for each level

timesheet_submission_audit
├─ Compliance tracking
├─ Submission timestamps vs. cutoffs
└─ Device/IP information
```

### 2. Service Engine
- **File:** `backend/src/services/timesheetEscalationEngine.js` (431 lines)
- **Language:** Node.js/Express.js

**Functions:**
```javascript
loadTimesheetConfig()          // Runtime config + 5-min cache
checkIncompleteTimesheets()    // Batch check & escalation trigger
determineCurrentEscalationLevel() // Time-based level calculation
applyEscalation()              // Create escalation event
markTimesheetComplete()        // Resolve escalation
getIncompleteTimesheets()      // Get user's pending timesheets
getEscalatedTimesheets()       // Get manager's escalations
recordSubmissionAudit()        // Compliance logging
```

### 3. API Routes
- **File:** `backend/src/routes/timesheetEscalationRoutes.js` (383 lines)
- **Endpoints:** 7 new endpoints + 1 stats endpoint

**Endpoints:**
```
GET    /api/timesheets/escalations
       └─ List escalated timesheets (role-filtered)

GET    /api/timesheets/pending
       └─ Get user's incomplete timesheets

POST   /api/timesheets/:id/complete
       └─ Mark timesheet submitted

POST   /api/timesheets/check-pending
       └─ Manual escalation trigger (Admin)

GET    /api/timesheets/escalations/history/:timesheetId
       └─ Escalation audit trail

GET    /api/timesheets/config
       └─ Get current cutoff configuration

PATCH  /api/timesheets/config
       └─ Update cutoff times (Admin)

GET    /api/timesheets/escalations/stats
       └─ Escalation statistics
```

### 4. Backend Integration
- **File:** `backend/src/index.js` (2 lines added)
- **Change:** Route registration for timesheetEscalationRoutes

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Database Migration
**Time:** 5 minutes

1. Navigate to Supabase SQL Editor
2. Run SQL migration:
   ```sql
   -- Copy entire contents of: backend/sql/04_timesheet_escalation.sql
   ```
3. Verify: Check that 4 new tables exist
   - `timesheet_escalation_tracking`
   - `timesheet_escalation_history`
   - `timesheet_cutoff_config`
   - `timesheet_submission_audit`

**Verification Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'timesheet_%'
ORDER BY table_name;
```

Expected Output: 4 rows

---

### Step 2: Backend Deployment
**Time:** 15 minutes

1. Copy service file:
   ```bash
   cp backend/src/services/timesheetEscalationEngine.js \
      backend/src/services/timesheetEscalationEngine.js
   ```

2. Copy route file:
   ```bash
   cp backend/src/routes/timesheetEscalationRoutes.js \
      backend/src/routes/timesheetEscalationRoutes.js
   ```

3. **Backend index.js already updated** - Contains:
   ```javascript
   const timesheetEscalationRoutes = require("./routes/timesheetEscalationRoutes");
   app.use("/api/timesheets", timesheetEscalationRoutes);
   ```

4. Restart backend:
   ```bash
   npm run dev  # Development
   # or
   pm2 restart all  # Production
   ```

5. Verify: Test health check
   ```bash
   curl http://localhost:5000/health
   ```

---

### Step 3: Cron Job Setup (CRITICAL)
**Time:** 10 minutes

The escalation engine needs to run automatically at specific times:
- **20:00** - Check & trigger Level 1 (Employee notification)
- **20:05** - Check & trigger Level 2 (Manager notification)
- **20:10** - Check & trigger Level 3 (Admin notification)

**Option A: Node Cron (Recommended for Single Server)**

Add to `backend/src/index.js` after `app.listen()`:

```javascript
const cron = require('node-cron');
const timesheetEngine = require('./services/timesheetEscalationEngine');

// Run escalation check at 20:00, 20:05, 20:10
cron.schedule('0 20 * * *', async () => {
  console.log('[CRON] 20:00 - Running escalation Level 1 check');
  await timesheetEngine.checkIncompleteTimesheets();
});

cron.schedule('5 20 * * *', async () => {
  console.log('[CRON] 20:05 - Running escalation Level 2 check');
  await timesheetEngine.checkIncompleteTimesheets();
});

cron.schedule('10 20 * * *', async () => {
  console.log('[CRON] 20:10 - Running escalation Level 3 check');
  await timesheetEngine.checkIncompleteTimesheets();
});

console.log('Timesheet escalation cron jobs initialized');
```

**Install dependency:**
```bash
npm install node-cron
```

**Option B: External Cron Service (Production)**

Use Supabase Edge Functions or AWS Lambda:
```
Trigger: POST /api/timesheets/check-pending
Time: 20:00, 20:05, 20:10 daily
Auth: Admin API key
```

**Option C: Docker/Systemd (if applicable)**

Create systemd timer service for background escalation daemon.

---

## 🧪 TESTING

### Test 1: Manual Escalation Trigger
```bash
# Trigger escalation check manually
curl -X POST http://localhost:5000/api/timesheets/check-pending \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "message": "Escalation check completed",
#   "processed": 5,
#   "escalations": [
#     {
#       "success": true,
#       "timesheetId": "uuid",
#       "escalationLevel": 2
#     }
#   ]
# }
```

### Test 2: Get Pending Timesheets
```bash
curl http://localhost:5000/api/timesheets/pending \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: Array of incomplete timesheets with escalation details
```

### Test 3: Mark Complete
```bash
curl -X POST http://localhost:5000/api/timesheets/uuid/complete \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json"

# Expected: Success with completion timestamp
```

### Test 4: View Configuration
```bash
curl http://localhost:5000/api/timesheets/config \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: Returns cutoff times and notification settings
```

---

## ⚙️ CONFIGURATION

### Modify Cutoff Times (Admin Only)

**Example: Change to 18:00, 18:05, 18:10**

```bash
curl -X PATCH http://localhost:5000/api/timesheets/config \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level_1_time": "18:00:00",
    "level_2_time": "18:05:00",
    "level_3_time": "18:10:00",
    "hard_deadline_time": "23:59:59",
    "send_email_level_1": true,
    "send_email_level_2": true,
    "send_email_level_3": true,
    "send_sms_level_2": true,
    "send_sms_level_3": true,
    "require_manager_approval_if_late": true
  }'
```

**Config Options:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| level_1_time | TIME | 20:00:00 | Employee notification cutoff |
| level_2_time | TIME | 20:05:00 | Manager escalation cutoff |
| level_3_time | TIME | 20:10:00 | Admin escalation cutoff |
| hard_deadline_time | TIME | 23:59:59 | Hard lock time |
| send_email_level_1 | BOOL | true | Send email at level 1 |
| send_email_level_2 | BOOL | true | Send email at level 2 |
| send_email_level_3 | BOOL | true | Send email at level 3 |
| send_sms_level_2 | BOOL | false | Send SMS at level 2 |
| send_sms_level_3 | BOOL | false | Send SMS at level 3 |
| require_manager_approval_if_late | BOOL | true | Need approval for post-deadline |
| auto_lock_after_deadline | BOOL | true | Lock after hard deadline |

---

## 📊 MONITORING

### Key Metrics

**Dashboard Query:**
```sql
SELECT 
  escalation_level,
  status,
  COUNT(*) as count
FROM timesheet_escalation_tracking
GROUP BY escalation_level, status
ORDER BY escalation_level;
```

**Recent Escalations:**
```sql
SELECT 
  user_id,
  escalation_level,
  level_1_triggered_at,
  level_2_triggered_at,
  level_3_triggered_at,
  status
FROM timesheet_escalation_tracking
WHERE timesheet_date = CURRENT_DATE
ORDER BY level_1_triggered_at DESC;
```

**API Endpoint:**
```bash
curl http://localhost:5000/api/timesheets/escalations/stats \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Returns:
# {
#   "total_escalations": 12,
#   "level_1": 12,
#   "level_2": 8,
#   "level_3": 2,
#   "pending": 6,
#   "escalated": 4,
#   "completed": 2
# }
```

---

## 🔄 WORKFLOW EXAMPLE

### Day 1: Employee Submits Timesheet Before Cutoff
1. **19:59** - Employee submits timesheet
2. Escalation tracking created with status: "completed"
3. No escalation events created
4. Audit logged: "submitted_before_level_1: true"

### Day 2: Employee Forgets to Submit
1. **20:00** - Cron triggers `checkIncompleteTimesheets()`
2. System detects incomplete timesheet
3. **Level 1 Event Created:**
   - Event type: "timesheet_pending_level_1"
   - Target: "employee"
   - Email sent (if configured)
   - Escalation tracking: level = 1

4. **20:05** - Cron triggers again
5. Still incomplete → **Level 2 Event Created:**
   - Event type: "timesheet_pending_level_2"
   - Target: "manager"
   - Email + SMS sent (if configured)
   - Escalation tracking: level = 2

6. **20:10** - Cron triggers again
7. Still incomplete → **Level 3 Event Created:**
   - Event type: "timesheet_pending_level_3"
   - Target: "admin"
   - Email + SMS sent (if configured)
   - Escalation tracking: level = 3

### Day 3: Late Submission
1. Employee submits at 22:30 (after hard deadline)
2. Timesheet marked "submitted"
3. Audit logged: "submitted_after_deadline: true"
4. Requires manager approval: true
5. Manager receives escalation to approve late submission
6. Manager approves or rejects with notes
7. Audit trail complete

---

## 🚨 TROUBLESHOOTING

### Issue: Escalations not triggering at scheduled times

**Solution:**
1. Check if cron job is running: `ps aux | grep node`
2. Check server logs for cron execution
3. Verify server timezone matches cutoff times
4. Test manual trigger: `curl -X POST /api/timesheets/check-pending`

### Issue: Employees not receiving notifications

**Solution:**
1. Check if email notifications enabled: `GET /api/timesheets/config`
2. Verify email service is configured (SendGrid, etc.)
3. Check notification service logs
4. Test manual notification trigger

### Issue: Escalation events not linking to timesheets

**Solution:**
1. Verify escalation_events table exists
2. Check foreign key constraints
3. Ensure timesheet_id values are valid UUIDs
4. Check backend logs for insertion errors

---

## 📈 NEXT PHASE

**Phase 3: Task Overdue Automation**
- Automatic task reopen tracking
- Overdue escalation workflows
- Task dependency automation

**Phase 5: Frontend UI**
- Timesheet escalation dashboard
- Real-time status updates
- Manager approval interface
- Employee notification center

---

## ✅ CHECKLIST

- [ ] SQL migration applied (4 tables created)
- [ ] Service file copied to backend/src/services/
- [ ] Route file copied to backend/src/routes/
- [ ] index.js updated (already done)
- [ ] Node-cron installed (`npm install node-cron`)
- [ ] Cron jobs configured in index.js
- [ ] Backend restarted
- [ ] Health check passes (`curl /health`)
- [ ] Manual escalation trigger tested
- [ ] Config endpoint responds correctly
- [ ] Escalation events created in Supabase
- [ ] Submission audit logging working
- [ ] Manager approval workflow tested

---

**Ready to deploy!** 🚀

All files are production-ready. Follow the deployment steps sequentially.  
Estimated deployment time: **30 minutes**
