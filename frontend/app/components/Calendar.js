"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@supabase/supabase-js";
import EventModal from "./EventModal";
import EventDetailModal from "./EventDetailModal";
import "./calendar.css";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [calendarView, setCalendarView] = useState("dayGridMonth");

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE || "https://offisphere.onrender.com";

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
    // Get user role from localStorage (try different keys)
    const storedUser = localStorage.getItem("user") || localStorage.getItem("offisphere_user");
    const storedRoles = localStorage.getItem("offisphere_roles");
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserRole(user.role || user.roles?.[0]);
      } catch (e) {
        console.warn("Failed to parse user from localStorage", e);
      }
    } else if (storedRoles) {
      try {
        const roles = JSON.parse(storedRoles);
        setUserRole(roles[0]);
      } catch (e) {
        console.warn("Failed to parse roles from localStorage", e);
      }
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabase
      .channel("events")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        (payload) => {
          console.log("Real-time event received:", payload);
          fetchEvents(); // Refresh events on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/events`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await res.json();

      // Transform events for FullCalendar
      const fcEvents = data.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start_time,
        end: event.end_time,
        extendedProps: {
          description: event.description,
          createdBy: event.created_by,
          visibility: event.visibility,
          createdAt: event.created_at,
        },
      }));

      setEvents(fcEvents);
      setError("");
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (selectInfo) => {
    if (["admin", "manager"].includes(userRole?.toLowerCase())) {
      setSelectedEvent({
        start: selectInfo.startStr,
        end: selectInfo.endStr,
      });
      setIsCreateModalOpen(true);
    }
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent(clickInfo.event);
    setIsDetailModalOpen(true);
  };

  const handleCreateEvent = async (formData) => {
    try {
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to create event");
      }

      setIsCreateModalOpen(false);
      fetchEvents(); // Refresh events
    } catch (err) {
      console.error("Error creating event:", err);
      setError(err.message);
    }
  };

  const handleUpdateEvent = async (eventId, formData) => {
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update event");
      }

      setIsDetailModalOpen(false);
      fetchEvents(); // Refresh events
    } catch (err) {
      console.error("Error updating event:", err);
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Failed to delete event");
      }

      setIsDetailModalOpen(false);
      fetchEvents(); // Refresh events
    } catch (err) {
      console.error("Error deleting event:", err);
      setError(err.message);
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="page-title">Calendar</h1>
          <p className="page-subtitle">
            {["admin", "manager"].includes(userRole?.toLowerCase())
              ? "Manage events and team schedules"
              : "View team events and schedules"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            Create Event
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* View controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setCalendarView("dayGridMonth")}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            calendarView === "dayGridMonth"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Month
        </button>
        <button
          onClick={() => setCalendarView("timeGridWeek")}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            calendarView === "timeGridWeek"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Week
        </button>
        <button
          onClick={() => setCalendarView("timeGridDay")}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            calendarView === "timeGridDay"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          Day
        </button>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-slate-500">Loading events...</div>
          </div>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "",
            }}
            events={events}
            selectable={["admin", "manager"].includes(userRole?.toLowerCase())}
            select={handleDateSelect}
            eventClick={handleEventClick}
            editable={["admin", "manager"].includes(userRole?.toLowerCase())}
            height="auto"
            contentHeight="auto"
            eventDisplay="block"
            eventClassNames="cursor-pointer hover:opacity-80"
          />
        )}
      </div>

      {/* Create Event Modal */}
      {isCreateModalOpen && (
        <EventModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateEvent}
          initialEvent={selectedEvent}
        />
      )}

      {/* Event Detail Modal */}
      {isDetailModalOpen && selectedEvent && (
        <EventDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          event={selectedEvent}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          canEdit={["admin", "manager"].includes(userRole?.toLowerCase())}
        />
      )}
    </motion.div>
  );
}
