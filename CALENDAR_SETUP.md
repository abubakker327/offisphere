# Event Calendar System - Implementation Guide

## Overview
This guide covers the complete implementation of a **Google Calendar–like event management system** for Offisphere with:
- **Role-Based Access Control (RBAC)**: Admin/Manager can create/edit/delete; Users view-only
- **Real-time Sync**: Supabase subscriptions auto-update events across all clients
- **Multi-view Calendar**: Month, Week, and Day views powered by FullCalendar
- **Responsive Design**: Works on desktop and mobile

---

## What's Included

### Backend (Express.js)

**File:** `backend/src/routes/eventRoutes.js`

**Endpoints:**
- `GET /api/events` - Fetch all authorized events
- `GET /api/events/:id` - Fetch single event
- `POST /api/events` - Create event (admin/manager only)
- `PUT /api/events/:id` - Update event (admin/manager only)
- `DELETE /api/events/:id` - Delete event (admin/manager only)

**RBAC Enforcement:**
- Admin/Manager roles can manage all events
- Regular users see only public events or their own
- All operations validated on backend

**Database Schema:** `backend/sql/events.sql`

### Frontend (Next.js)

**Components:**
- `app/components/Calendar.js` - Main calendar with FullCalendar integration
- `app/components/EventModal.js` - Create event modal (admin/manager only)
- `app/components/EventDetailModal.js` - View/edit event details
- `app/components/calendar.css` - Google Calendar–like styling

**Pages:**
- `app/dashboard/calendar/page.js` - Calendar route

**Navigation:** Added "Calendar" link to HR Management nav group

---

## Setup Instructions

### 1. Create Supabase Events Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy entire contents from: backend/sql/events.sql
```

This creates:
- `events` table with title, description, start_time, end_time, created_by, visibility
- Row-Level Security (RLS) policies enforcing RBAC
- Indexes for performance
- Auto-update trigger for `updated_at`

### 2. Register Backend Routes

The event routes are already integrated into `backend/src/index.js`:

```javascript
const eventRoutes = require("./routes/eventRoutes");
app.use("/api/events", eventRoutes);
```

No additional action needed if using latest code.

### 3. Frontend Dependencies

Already added to `frontend/package.json`:
```json
"@fullcalendar/core": "^6.1.10",
"@fullcalendar/daygrid": "^6.1.10",
"@fullcalendar/timegrid": "^6.1.10",
"@fullcalendar/react": "^6.1.10",
"@fullcalendar/interaction": "^6.1.10",
"@supabase/supabase-js": "^2.38.0"
```

Install with:
```bash
cd frontend
npm install
```

### 4. Environment Variables

**Backend (.env):**
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Frontend (.env.local):**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_BASE=https://your-backend-url.com (or http://localhost:5000 for dev)
```

---

## Usage

### For Admin/Manager Users

1. **Navigate** to Dashboard → HR Management → Calendar
2. **Create Event**: Click "Create Event" button → Fill form (title, description, start/end time, visibility)
3. **Edit Event**: Click event → Click "Edit" → Modify and save
4. **Delete Event**: Click event → Click "Delete" → Confirm
5. **Switch Views**: Use Month/Week/Day buttons at the top

### For Regular Users

1. **View Events**: Open Calendar page (read-only view)
2. **See public events** and any events they created
3. **View Details**: Click any event to see full details

---

## Real-Time Sync

The calendar automatically subscribes to Supabase real-time changes:

```javascript
const channel = supabase
  .channel("events")
  .on("postgres_changes", {
    event: "*",
    schema: "public",
    table: "events",
  }, (payload) => {
    fetchEvents(); // Auto-refresh when changes occur
  })
  .subscribe();
```

**When events are created, updated, or deleted by ANY user**, all connected clients see the change instantly (no page refresh needed).

---

## RBAC Rules

| Action | Admin | Manager | User |
|--------|-------|---------|------|
| View all events | ✓ | ✓ | ✗ |
| View own + public | ✗ | ✗ | ✓ |
| Create event | ✓ | ✓ | ✗ |
| Edit event | ✓ | ✓ | ✗ |
| Delete event | ✓ | ✓ | ✗ |

---

## Testing Checklist

### Local Dev (with ngrok for mobile)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Expose to mobile (optional)
npx ngrok http 3000
```

Then visit: `http://localhost:3000/dashboard/calendar`

### Real-time Sync Test

1. Open calendar in two browser tabs
2. Create an event in Tab 1
3. **Tab 2 should auto-update** (verify no refresh needed)
4. Edit event in Tab 1
5. **Tab 2 should show changes instantly**

### RBAC Test

1. **Login as Admin/Manager**: See "Create Event" button
2. **Login as User**: Button hidden, view-only access
3. **Try API bypass**: `POST /api/events` as User → Returns 403 Forbidden

### Mobile Test

1. Visit ngrok URL on mobile (Safari/Chrome)
2. Tap Month/Week/Day buttons
3. Create event (if Manager)
4. Verify responsive layout

---

## Customization

### Change Colors

Edit `app/components/calendar.css`:
```css
.fc .fc-event-main {
  background-color: #YOUR_COLOR;
}
```

### Change Event Fields

1. Update Supabase schema (add columns)
2. Update `EventModal.js` (add form fields)
3. Update `Calendar.js` (include in API calls)

### Change Permissions

Edit `canManageEvents()` in `backend/src/routes/eventRoutes.js`:
```javascript
const canManageEvents = (role) => 
  ["admin", "manager", "lead"].includes(role?.toLowerCase());
```

---

## Troubleshooting

**Events not syncing in real-time?**
- Verify Supabase URL and keys in `.env.local`
- Check Supabase RLS policies are enabled
- Open DevTools Console for errors

**"Create Event" button not showing?**
- Verify user role is "admin" or "manager" (check localStorage)
- Backend correctly parses role from JWT

**Build errors?**
- Ensure all FullCalendar plugins installed: `npm install`
- Check CSS syntax (no `:global()`, use plain class selectors)

**CORS errors?**
- Verify `CORS_ORIGINS` in backend includes frontend URL
- Use credentials: "include" in fetch calls

---

## Architecture Diagram

```
┌─────────────────┐
│   Browser Tab   │
│    (Calendar    │───────┐
│    Component)   │       │ Supabase
│                 │◄──Real-time sub
└─────────────────┘       │
       │                  │
       │ Fetch events     │
       │ Create/Edit/Del  │
       │                  │
    ┌──▼──────────────────┴─┐
    │   Backend (Express)    │
    │  eventRoutes.js        │
    │  - RBAC validation     │
    │  - API endpoints       │
    └──┬──────────────────┬──┘
       │                  │
       │  Supabase SQL    │
       │  events table    │
       │  (RLS policies)  │
       │                  │
    ┌──▼──────────────────▼──┐
    │   Supabase Database    │
    │  - PostgreSQL          │
    │  - Real-time broadcast │
    └────────────────────────┘
```

---

## Next Steps

- Deploy backend to Render, Railway, or Heroku
- Deploy frontend to Vercel
- Enable Supabase Database Webhooks for email notifications
- Add calendar invitations & RSVP functionality
- Sync with Google Calendar (OAuth integration)

---

## Support

For issues, check:
1. Network tab in DevTools (API calls)
2. Supabase logs (SQL errors)
3. Backend console output (route errors)
4. Browser console (client-side errors)

Ensure all environment variables are set correctly!
