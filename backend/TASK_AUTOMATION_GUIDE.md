# 📋 TASK OVERDUE AUTOMATION - DEPLOYMENT GUIDE

**Phase 3 Implementation**  
**Date:** January 28, 2026  
**Status:** 🟢 Ready for Deployment

---

## 🎯 What's Included

### Task Overdue Detection & Escalation
- **Level 1 (Day 0):** Immediate notification - "Task is due today"
- **Level 2 (Day 3):** Manager escalation - "Task 3 days overdue"
- **Level 3 (Day 5):** Admin escalation - "Critical: Task 5 days overdue"

### Dependency Tracking
✅ Task blocking relationships (A blocks B)  
✅ Automatic dependency violation detection  
✅ Waiver system for dependency exceptions  
✅ Audit trail for all dependency actions  

### Auto-Reopen Workflow
✅ Automatic task reopen if dependencies incomplete  
✅ Reopen reason tracking (blocked_by, incomplete, etc.)  
✅ Reassignment during reopen  
✅ Manager notifications on reopen  

### Features
✅ Extensible task due dates with approval workflow  
✅ Complete escalation history tracking  
✅ Multi-level escalation with configurable days  
✅ Real-time dependency status monitoring  
✅ Compliance audit logs for all actions  

---

## 📁 Files Created

### 1. SQL Migration
- **File:** `backend/sql/05_task_automation.sql` (410 lines)
- **Tables:** 7 new tables + 24 indexes
- **Default Config:** 0, 3, 5 days escalation thresholds

**Tables:**
```
task_dependencies
├─ Blocking/blocked relationships
├─ Dependency type & status
└─ Waiver tracking

task_overdue_tracking
├─ Escalation state (level, timestamps)
├─ Links to escalation_events
└─ Resolution audit

task_reopen_history
├─ All reopen actions
├─ Original & new state
└─ Reopen reasons

task_dependency_waivers
├─ Waiver requests & approvals
├─ Time-limited waivers
└─ Rejection tracking

task_escalation_audit
├─ Complete escalation log
├─ All actions (triggered, reopened, etc.)
└─ Comprehensive audit trail

task_overdue_config
├─ Escalation thresholds (days)
├─ Notification settings
└─ Behavior flags
```

### 2. Service Engine
- **File:** `backend/src/services/taskOverdueAutomationEngine.js` (517 lines)
- **Language:** Node.js/Express.js

**Functions:**
```javascript
loadTaskConfig()                  // Runtime config + 5-min cache
getDefaultTaskConfig()            // Default settings
checkOverdueTasks()               // Batch overdue check & escalation
determineEscalationLevel()        // Level based on days
checkBlockingDependencies()       // Check if task is blocked
applyEscalation()                 // Create escalation event
autoReopenBlockedTask()           // Auto-reopen if blocked
createDependency()                // Create blocking relationship
resolveDependency()               // Resolve/waive dependency
extendTaskDueDate()               // Extend with approval
getOverdueTasks()                 // Get user's overdue tasks
getTaskDependencies()             // Get blocking/blocked tasks
```

### 3. API Routes
- **File:** `backend/src/routes/taskOverdueAutomationRoutes.js` (379 lines)
- **Endpoints:** 11 new endpoints + 1 stats endpoint

**Endpoints:**
```
GET    /api/tasks/overdue
       └─ Get overdue tasks for user

GET    /api/tasks/:taskId/dependencies
       └─ Get blocking/blocked tasks

POST   /api/tasks/:blockingTaskId/blocks/:blockedTaskId
       └─ Create dependency (Manager/Admin)

DELETE /api/tasks/dependencies/:dependencyId
       └─ Resolve dependency (Manager/Admin)

POST   /api/tasks/check-overdue
       └─ Manual overdue check (Admin)

GET    /api/tasks/overdue/tracking
       └─ View all overdue tracking (Manager/Admin)

PATCH  /api/tasks/:taskId/extend-due-date
       └─ Extend task due date

GET    /api/tasks/escalation/audit
       └─ View escalation audit logs (Manager/Admin)

GET    /api/tasks/config
       └─ Get configuration

PATCH  /api/tasks/config
       └─ Update configuration (Admin)

GET    /api/tasks/stats/overdue
       └─ Overdue statistics (Manager/Admin)
```

### 4. Backend Integration
- **File:** `backend/src/index.js` (2 lines added)
- **Change:** Route registration for taskOverdueAutomationRoutes

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Database Migration
**Time:** 5 minutes

1. Navigate to Supabase SQL Editor
2. Run SQL migration:
   ```sql
   -- Copy entire contents of: backend/sql/05_task_automation.sql
   ```
3. Verify: Check that 7 new tables exist
   - `task_dependencies`
   - `task_overdue_tracking`
   - `task_reopen_history`
   - `task_dependency_waivers`
   - `task_escalation_audit`
   - `task_overdue_config`

**Verification Query:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'task_%'
ORDER BY table_name;
```

Expected Output: 6 rows

---

### Step 2: Backend Deployment
**Time:** 15 minutes

1. Copy service file:
   ```bash
   cp backend/src/services/taskOverdueAutomationEngine.js \
      backend/src/services/taskOverdueAutomationEngine.js
   ```

2. Copy route file:
   ```bash
   cp backend/src/routes/taskOverdueAutomationRoutes.js \
      backend/src/routes/taskOverdueAutomationRoutes.js
   ```

3. **Backend index.js already updated** - Contains:
   ```javascript
   const taskOverdueAutomationRoutes = require("./routes/taskOverdueAutomationRoutes");
   app.use("/api/tasks", taskOverdueAutomationRoutes);
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

The overdue engine needs to run automatically (once daily or multiple times):

**Option A: Daily Check (Recommended)**

Add to `backend/src/index.js` after `app.listen()`:

```javascript
const cron = require('node-cron');
const taskEngine = require('./services/taskOverdueAutomationEngine');

// Run overdue check daily at 08:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] 08:00 - Running task overdue check');
  await taskEngine.checkOverdueTasks();
});

console.log('Task overdue escalation cron job initialized');
```

**Option B: Multiple Daily Checks**

```javascript
const cron = require('node-cron');
const taskEngine = require('./services/taskOverdueAutomationEngine');

// Check at 08:00 AM, 12:00 PM, 4:00 PM
cron.schedule('0 8 * * *', async () => {
  console.log('[CRON] 08:00 - Running task overdue check');
  await taskEngine.checkOverdueTasks();
});

cron.schedule('0 12 * * *', async () => {
  console.log('[CRON] 12:00 - Running task overdue check');
  await taskEngine.checkOverdueTasks();
});

cron.schedule('0 16 * * *', async () => {
  console.log('[CRON] 16:00 - Running task overdue check');
  await taskEngine.checkOverdueTasks();
});

console.log('Task overdue escalation cron jobs initialized');
```

---

## 🧪 TESTING

### Test 1: Manual Overdue Check
```bash
curl -X POST http://localhost:5000/api/tasks/check-overdue \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# Expected response:
# {
#   "message": "Overdue check completed",
#   "processed": 24,
#   "escalations": [...],
#   "reopened": [...]
# }
```

### Test 2: Get User's Overdue Tasks
```bash
curl http://localhost:5000/api/tasks/overdue \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: Array of overdue tasks with tracking info
```

### Test 3: Create Task Dependency
```bash
curl -X POST http://localhost:5000/api/tasks/uuid1/blocks/uuid2 \
  -H "Authorization: Bearer MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "dependencyType": "blocks",
    "reason": "Task 2 requires Task 1 completion"
  }'

# Expected: Dependency created with status "active"
```

### Test 4: Get Task Dependencies
```bash
curl http://localhost:5000/api/tasks/uuid/dependencies \
  -H "Authorization: Bearer USER_TOKEN"

# Expected: Array with blocking and blocked tasks
```

### Test 5: Extend Task Due Date
```bash
curl -X PATCH http://localhost:5000/api/tasks/uuid/extend-due-date \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newDueDate": "2026-02-15",
    "extensionReason": "Delayed by client feedback"
  }'

# Expected: Due date updated, audit logged
```

### Test 6: View Statistics
```bash
curl http://localhost:5000/api/tasks/stats/overdue \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Expected:
# {
#   "total_overdue": 12,
#   "level_1": 12,
#   "level_2": 8,
#   "level_3": 2,
#   "avg_days_overdue": 3
# }
```

---

## ⚙️ CONFIGURATION

### Modify Escalation Thresholds

**Example: Change to 1, 4, 7 days**

```bash
curl -X PATCH http://localhost:5000/api/tasks/config \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "level_1_days_after_due": 1,
    "level_2_days_after_due": 4,
    "level_3_days_after_due": 7,
    "send_email_level_1": true,
    "send_email_level_2": true,
    "send_email_level_3": true,
    "send_sms_level_2": true,
    "send_sms_level_3": true,
    "auto_reopen_if_blocked": true,
    "require_manager_approval_if_extended": true
  }'
```

**Config Options:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| level_1_days_after_due | INT | 0 | Days after due for L1 |
| level_2_days_after_due | INT | 3 | Days after due for L2 |
| level_3_days_after_due | INT | 5 | Days after due for L3 |
| auto_reopen_if_blocked | BOOL | true | Auto-reopen blocked tasks |
| allow_post_due_extension | BOOL | true | Allow time extension |
| require_manager_approval_if_extended | BOOL | true | Need approval |
| send_email_level_1 | BOOL | true | Email at L1 |
| send_email_level_2 | BOOL | true | Email at L2 |
| send_email_level_3 | BOOL | true | Email at L3 |
| send_sms_level_2 | BOOL | false | SMS at L2 |
| send_sms_level_3 | BOOL | false | SMS at L3 |

---

## 📊 MONITORING

### Key Metrics

**Dashboard Query:**
```sql
SELECT 
  escalation_level,
  status,
  COUNT(*) as count,
  ROUND(AVG(days_overdue)) as avg_days_overdue
FROM task_overdue_tracking
GROUP BY escalation_level, status
ORDER BY escalation_level;
```

**Most Overdue Tasks:**
```sql
SELECT 
  t.id, t.title, u.full_name, tot.days_overdue,
  tot.escalation_level, tot.status
FROM task_overdue_tracking tot
JOIN tasks t ON tot.task_id = t.id
JOIN users u ON tot.assigned_to = u.id
WHERE tot.status != 'resolved'
ORDER BY tot.days_overdue DESC
LIMIT 20;
```

**API Endpoint:**
```bash
curl http://localhost:5000/api/tasks/stats/overdue \
  -H "Authorization: Bearer MANAGER_TOKEN"

# Returns:
# {
#   "total_overdue": 24,
#   "level_1": 24,
#   "level_2": 16,
#   "level_3": 4,
#   "pending": 8,
#   "escalated": 12,
#   "resolved": 4,
#   "reopened": 2,
#   "avg_days_overdue": 5
# }
```

---

## 🔄 WORKFLOW EXAMPLES

### Example 1: Task Completion on Time
1. Task due date: 2026-01-30
2. Assignee completes: 2026-01-29
3. No escalation triggered ✅

### Example 2: Task 3 Days Overdue
1. Task due date: 2026-01-30
2. Today: 2026-02-02 (3 days overdue)
3. **Level 1 & 2 Triggered:**
   - Level 1 (Day 0) → Already triggered on 1/30
   - Level 2 (Day 3) → Triggered today at 08:00
4. Manager receives notification
5. Escalation events created in system

### Example 3: Task Blocked by Dependency
1. Task A (due 2026-01-28): Complete
2. Task B (due 2026-01-30): Incomplete, *blocked by A*
3. Today: 2026-02-02
4. System detects: Task B overdue AND blocked
5. **Auto-Reopen Triggered:**
   - Task B automatically reopened
   - Status: "reopened"
   - Reason: "dependency_blocked"
6. Manager notified to reassign

### Example 4: Task Extension Request
1. Task due date: 2026-01-30
2. Today: 2026-02-05 (5 days overdue)
3. Assignee requests extension to 2026-02-15
4. Request marked with reason
5. Manager approves (if required)
6. New due date: 2026-02-15
7. Escalation continues from new date

---

## 🚨 TROUBLESHOOTING

### Issue: Escalations not triggering

**Solution:**
1. Check cron job is running: `ps aux | grep node`
2. Check logs for cron execution
3. Verify server timezone
4. Test manual trigger: `POST /api/tasks/check-overdue`
5. Check task_overdue_config is active

### Issue: Dependencies not enforcing

**Solution:**
1. Verify task_dependencies table has records
2. Check `is_active` flag is TRUE
3. Test `GET /api/tasks/:taskId/dependencies`
4. Verify blocking_task status is not "completed"

### Issue: Auto-reopen not working

**Solution:**
1. Check config: `auto_reopen_if_blocked = true`
2. Verify task has active blocking dependencies
3. Check task status is "completed" or "cancelled"
4. Review task_reopen_history for audit
5. Test manual check: `POST /api/tasks/check-overdue`

---

## 📈 NEXT PHASE

**Phase 5: Frontend UI**
- Task overdue dashboard
- Dependency visualization
- Extension request interface
- Escalation notification center

**Phase 6: Advanced Features** (Optional)
- Critical path analysis
- Dependency chain visualization
- Predictive overdue warnings
- Team capacity planning

---

## ✅ CHECKLIST

- [ ] SQL migration applied (7 tables created)
- [ ] Service file copied to backend/src/services/
- [ ] Route file copied to backend/src/routes/
- [ ] index.js updated (already done)
- [ ] Cron jobs configured in index.js
- [ ] Backend restarted
- [ ] Health check passes (`curl /health`)
- [ ] Manual overdue check tested
- [ ] Config endpoint responds correctly
- [ ] Task dependencies work
- [ ] Auto-reopen functionality tested
- [ ] Extension workflow tested
- [ ] Manager notifications working
- [ ] Escalation events created in Supabase

---

**Ready to deploy!** 🚀

All files are production-ready. Follow the deployment steps sequentially.  
Estimated deployment time: **30 minutes**

---

## 📚 RELATED DOCUMENTATION

- [Timesheet Escalation Guide](./TIMESHEET_ESCALATION_GUIDE.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- [Quick Reference](./QUICK_REFERENCE.md)
