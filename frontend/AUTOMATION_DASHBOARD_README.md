# Automation Dashboard Frontend Implementation

## Overview

The Frontend Automation Dashboard provides a comprehensive UI for monitoring and managing all four automation systems:

- **Attendance Anomalies** - RFID tracking, anomaly detection, LOP management
- **Timesheet Escalation** - Hard cutoff enforcement (20:00, 20:05, 20:10)
- **Task Overdue Automation** - Dependency tracking, auto-reopen, escalation
- **Payroll Coupling** - Validation gating, dual approval, blocking mechanism

## Directory Structure

```
frontend/
├── app/
│   └── dashboard/
│       └── automations/
│           ├── page.js                 # Main dashboard hub
│           ├── attendance/
│           │   └── page.js              # Attendance anomalies detail page
│           ├── timesheet/
│           │   └── page.js              # Timesheet escalation detail page
│           ├── tasks/
│           │   └── page.js              # Task overdue detail page
│           └── payroll/
│               └── page.js              # Payroll coupling detail page
└── lib/
    └── automationApi.js                 # API client & hooks
```

## Pages & Components

### 1. Main Dashboard (`/dashboard/automations`)

**Purpose:** Central hub showing KPI cards for all four systems with real-time stats.

**Features:**
- 4 KPI cards with alert badges (Attendance, Timesheet, Tasks, Payroll)
- 4 feature cards with quick description and drill-down links
- Real-time data refresh every 30 seconds
- Role-based visibility (employees see own data, managers see team, admins see all)
- Responsive grid layout (1 col mobile, 2 cols tablet, 4 cols desktop)

**Key Components:**
```javascript
- Stats fetching from all 4 endpoints
- Motion animations for smooth transitions
- Link routing to detail pages
- Loading states and error handling
```

### 2. Attendance Anomalies (`/dashboard/automations/attendance`)

**Purpose:** Detailed view of RFID-detected anomalies with manager actions.

**Features:**
- List of all anomalies with status filtering (All, Unresolved, Escalated)
- Anomaly type icons (Missing Checkout ⏁, Duplicate Checkin ⧉, Abnormal Hours ⧌)
- Status badges (Pending, Escalated, Resolved)
- Detail modal with full information
- Statistics grid (Total, Unresolved, Escalated)
- Real-time refresh every 30 seconds

**Filtering Options:**
```javascript
- All: Show all anomalies
- Unresolved: status !== "resolved"
- Escalated: status === "escalated"
```

**API Calls:**
- GET `/api/attendance/anomalies` - List all anomalies
- PATCH `/api/attendance/anomalies/:id/resolve` - Resolve anomaly
- POST `/api/attendance/anomalies/:id/escalate` - Escalate to higher management

### 3. Timesheet Escalation (`/dashboard/automations/timesheet`)

**Purpose:** Monitor timesheet submission deadlines with level-based escalations.

**Features:**
- 3-level visual indicators (Level 1: Yellow, Level 2: Orange, Level 3: Red)
- Hard cutoff times displayed (20:00, 20:05, 20:10)
- Escalation level breakdown cards
- Status indicators for each timesheet
- Detail modal with quick submit action
- Real-time refresh every 15 seconds (more frequent due to time sensitivity)

**Escalation Levels:**
```javascript
Level 1: 20:00 - First Warning (Yellow)
Level 2: 20:05 - Urgent Notice (Orange)
Level 3: 20:10 - Timesheet Locked (Red)
```

**API Calls:**
- GET `/api/timesheets/escalations` - List escalated timesheets
- GET `/api/timesheets/escalations/stats` - Get statistics
- GET `/api/timesheets/pending` - Get user's incomplete timesheets
- POST `/api/timesheets/:id/complete` - Complete timesheet

### 4. Task Overdue (`/dashboard/automations/tasks`)

**Purpose:** Track overdue tasks with dependency visualization and auto-reopen tracking.

**Features:**
- Overdue task list grouped by escalation level (0-3 days, 3-5 days, 5+ days)
- Days overdue indicator with color gradient
- Dependency display (blocking/blocked-by relationships)
- Auto-reopen status tracking
- Extend due date interface
- Detail modal showing full task info with dependencies
- Real-time refresh every 30 seconds

**Escalation Levels:**
```javascript
Level 1: 0-3 days overdue (Yellow)
Level 2: 3-5 days overdue (Orange)
Level 3: 5+ days overdue (Red)
```

**Key Features:**
- Automatic task reopening when blocking dependencies are unresolved
- Waiver system for dependency blocking
- Audit trail of reopen events
- Extended due date tracking

**API Calls:**
- GET `/api/tasks/overdue` - List overdue tasks
- GET `/api/tasks/stats/overdue` - Get statistics
- GET `/api/tasks/:taskId/dependencies` - Get blocking relationships
- POST `/api/tasks/:blockingId/blocks/:blockedId` - Create dependency
- PATCH `/api/tasks/:taskId/extend-due-date` - Extend deadline

### 5. Payroll Coupling (`/dashboard/automations/payroll`)

**Purpose:** Manage payroll runs with validation, blocking, and dual approval.

**Features:**
- Payroll run status tracking with color-coded cards
- Approval progress bar (Validation → HR → Finance → Processed)
- Blocked runs indicator (non-bypassable attendance blocks)
- Dual approval workflow status
- Employee count and period display
- Detail modal with full approval state
- Real-time refresh every 60 seconds

**Approval Workflow:**
```javascript
Step 1: Validation (25%) - Automated validation checks
Step 2: HR Approval (25%) - Manager/HR sign-off
Step 3: Finance Approval (25%) - Finance controller sign-off
Step 4: Processed (25%) - Final system processing
```

**Blocking Logic:**
- Payroll is automatically blocked if critical attendance anomalies exist
- Blocks are **non-bypassable** and prevent any approval
- Blocks clear only when underlying attendance issues are resolved

**API Calls:**
- GET `/api/payroll/runs` - List payroll runs
- POST `/api/payroll/runs/:id/validate` - Run validation
- GET `/api/payroll/runs/:id/validation-results` - Get validation details
- PATCH `/api/payroll/runs/:id/approve/hr` - HR approval
- PATCH `/api/payroll/runs/:id/approve/finance` - Finance approval
- PATCH `/api/payroll/runs/:id/release-hold` - Release blocks

## API Integration

### Using the API Client

**Location:** `frontend/lib/automationApi.js`

**Basic Usage:**
```javascript
import { automationApi } from "@/lib/automationApi";

// Fetch anomalies
const anomalies = await automationApi.getAnomalies();

// Resolve anomaly
await automationApi.resolveAnomaly(anomalyId, "Approved - Valid overtime");

// Get task dependencies
const deps = await automationApi.getTaskDependencies(taskId);

// Approve payroll (HR)
await automationApi.approvePayrollHR(runId);
```

### Custom Hook Usage

**Location:** `frontend/lib/automationApi.js`

```javascript
import { useAutomationData } from "@/lib/automationApi";

function MyComponent() {
  // Real-time data with auto-refresh
  const { data: anomalies, loading, error } = useAutomationData("anomalies");
  const { data: tasks, loading: tasksLoading } = useAutomationData("tasks", {
    filters: { status: "overdue" },
    refreshInterval: 15000, // Custom refresh rate
  });

  // Use data
}
```

## Authentication & Authorization

All API calls automatically include:
- JWT token via `credentials: "include"`
- Role-based filtering handled at API level
- Employee: See only own data
- Manager: See own + team data (filtered by department/manager_id)
- Admin: See all company data

The frontend components trust the API to enforce authorization.

## Real-Time Updates

### Refresh Rates

```javascript
Attendance Anomalies: 30 seconds
Timesheet Escalations: 15 seconds (time-critical)
Task Overdue: 30 seconds
Payroll Runs: 60 seconds
```

### Future: Supabase Real-Time Subscriptions

To enable true real-time updates without polling:

```javascript
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Subscribe to anomaly changes
supabase
  .from("escalation_events")
  .on("*", (payload) => {
    console.log("Change received!", payload);
    // Update UI in real-time
  })
  .subscribe();
```

## Styling & Design

### Color System

**Severity Levels:**
- **Yellow/Amber:** Level 1 - Warning/Initial escalation
- **Orange:** Level 2 - Urgent/Escalated to management
- **Red:** Level 3 - Critical/Time-sensitive or blocked

**Status Indicators:**
- **Green:** Resolved/Approved/Completed
- **Blue:** Info/Primary actions
- **Purple:** Payroll system
- **Gray:** Neutral/Secondary

### Components Used

- **Layout:** Tailwind CSS grid + flexbox
- **Animations:** Framer Motion for smooth transitions
- **Icons:** Inline SVG icons (no external icon library)
- **Responsive:** Mobile-first design with media queries
- **Modals:** Click-to-open detail panels with backdrop

## Error Handling

All pages include:
- Try-catch blocks for API calls
- Loading states during data fetch
- Error display with retry options
- Fallback empty states ("No records found")
- Console error logging for debugging

## Performance Optimizations

1. **Interval Cleanup:** All `setInterval` cleared on component unmount
2. **Debouncing:** List filtering debounced to avoid excessive re-renders
3. **Lazy Loading:** Dependency data fetched on-demand (detail modal open)
4. **Caching:** API responses cached in state
5. **Selective Rendering:** Conditional filters reduce list size

## Testing Checklist

### Attendance Page
- [ ] Load and display anomalies list
- [ ] Filter by All/Unresolved/Escalated
- [ ] Click anomaly to open detail modal
- [ ] Close modal without action
- [ ] Verify stats update in real-time

### Timesheet Page
- [ ] Load escalations and display by level
- [ ] Show correct cutoff times per level
- [ ] Click to open timesheet details
- [ ] Verify 15-second refresh working
- [ ] Test Level 1/2/3 color coding

### Task Page
- [ ] Load overdue tasks
- [ ] Filter by days overdue (0-3, 3-5, 5+)
- [ ] Display dependencies in detail modal
- [ ] Show auto-reopen status
- [ ] Verify color coding by days overdue

### Payroll Page
- [ ] Load payroll runs
- [ ] Filter by status (Pending, Blocked, Approved)
- [ ] Display approval progress bar correctly
- [ ] Show blocked status with red indicator
- [ ] Verify dual approval badges display

## Deployment

### Frontend Build
```bash
npm run build
```

### Environment Variables
```
NEXT_PUBLIC_API_BASE=https://offisphere.onrender.com
```

### Production URLs
- Development: `http://localhost:3000/dashboard/automations`
- Production: `https://app.offisphere.com/dashboard/automations`

## File Manifest

| File | Lines | Purpose |
|------|-------|---------|
| `page.js` (main) | ~450 | Dashboard hub with KPI cards |
| `attendance/page.js` | ~380 | Anomalies detail page |
| `timesheet/page.js` | ~420 | Escalation detail page |
| `tasks/page.js` | ~480 | Overdue detail page |
| `payroll/page.js` | ~470 | Payroll detail page |
| `automationApi.js` | ~320 | API client + hooks |

**Total Frontend Code:** ~2,520 lines

## Integration with Backend

All backend endpoints are fully implemented and ready:

### Attendance Anomaly Endpoints
- `GET /api/attendance/anomalies` ✓
- `PATCH /api/attendance/anomalies/:id/resolve` ✓
- `POST /api/attendance/anomalies/:id/escalate` ✓

### Timesheet Escalation Endpoints
- `GET /api/timesheets/escalations` ✓
- `GET /api/timesheets/escalations/stats` ✓
- `POST /api/timesheets/:id/complete` ✓

### Task Overdue Endpoints
- `GET /api/tasks/overdue` ✓
- `GET /api/tasks/stats/overdue` ✓
- `GET /api/tasks/:id/dependencies` ✓
- `PATCH /api/tasks/:id/extend-due-date` ✓

### Payroll Endpoints
- `GET /api/payroll/runs` ✓
- `PATCH /api/payroll/runs/:id/approve/hr` ✓
- `PATCH /api/payroll/runs/:id/approve/finance` ✓

## Future Enhancements

1. **Critical Path Visualization** - Diagram showing blocking dependencies
2. **Predictive Warnings** - ML-based overdue task prediction
3. **Email Notifications** - Escalation event emails
4. **Mobile App** - React Native version
5. **Batch Actions** - Bulk approve/resolve functionality
6. **Export Reports** - PDF/Excel download capabilities
7. **Custom Dashboards** - User-defined widget layouts
8. **Audit Trail Viewer** - Complete action history per item

## Support & Documentation

For API reference, see:
- `backend/IMPLEMENTATION_GUIDE.md` - Full backend documentation
- `backend/QUICK_REFERENCE.md` - Quick endpoint lookup
- `backend/TIMESHEET_ESCALATION_GUIDE.md` - Timesheet system details
- `backend/TASK_AUTOMATION_GUIDE.md` - Task automation details

---

**Created:** Phase 5 Implementation
**Framework:** Next.js 13+ with React
**UI Library:** Tailwind CSS + Framer Motion
**Status:** Ready for integration testing
