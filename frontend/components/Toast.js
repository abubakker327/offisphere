"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function handleToastEvent(event) {
      const { type = "success", message = "" } = event.detail || {};
      if (!message) return;

      const id = Date.now() + Math.random();

      setToasts((prev) => [...prev, { id, type, message }]);

      // Auto-remove after 3s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    }

    window.addEventListener("offisphere-toast", handleToastEvent);
    return () =>
      window.removeEventListener("offisphere-toast", handleToastEvent);
  }, []);

  const getColors = (type) => {
    if (type === "error") {
      return {
        bg: "bg-rose-50",
        border: "border-rose-200",
        text: "text-rose-800",
      };
    }
    if (type === "info") {
      return {
        bg: "bg-sky-50",
        border: "border-sky-200",
        text: "text-sky-800",
      };
    }
    // success default
    return {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      text: "text-emerald-800",
    };
  };

  const getIcon = (type) => {
    if (type === "error") return "!";
    if (type === "info") return "i";
    return "OK";
  };

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => {
          const colors = getColors(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto ${colors.bg} ${colors.border} ${colors.text} border rounded-xl shadow-md px-3 py-2 text-xs flex items-center gap-2`}
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/70 text-[10px]">
                {getIcon(toast.type)}
              </span>
              <span className="flex-1">{toast.message}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
