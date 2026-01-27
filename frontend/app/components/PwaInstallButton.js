"use client";

import { useEffect, useState } from "react";

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const onInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    try {
      const choice = await deferredPrompt.userChoice;
      console.log("PWA install choice:", choice);
    } catch (err) {
      console.warn("PWA prompt error", err);
    }

    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <button
      onClick={onInstall}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
      aria-label="Install Offisphere"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M5 12h14" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
      Install
    </button>
  );
}
