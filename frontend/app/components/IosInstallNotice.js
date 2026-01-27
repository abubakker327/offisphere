"use client";

import { useEffect, useState } from "react";

export default function IosInstallNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem("ios-install-dismissed");
      if (dismissed) return;

      const ua = navigator.userAgent || navigator.vendor || window.opera;
      const isIos = /iPad|iPhone|iPod/.test(ua);
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);

      if (isIos && isSafari) setVisible(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem("ios-install-dismissed", "1");
    } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="rounded-md bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800 flex items-start gap-3">
      <div className="flex-1">
        <div className="font-semibold">Add to Home Screen</div>
        <div className="mt-1">Tap Share → <span className="font-medium">Add to Home Screen</span> in Safari to install Offisphere.</div>
      </div>
      <button onClick={dismiss} className="ml-2 text-amber-700 bg-amber-100 px-3 py-1 rounded">
        Dismiss
      </button>
    </div>
  );
}
