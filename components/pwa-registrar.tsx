"use client";

import { useEffect } from "react";
import { InstallExperience } from "./pwa-install";

export function PwaRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || !window.isSecureContext || process.env.NODE_ENV !== "production") {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app still works in the browser if registration is unavailable.
    });
  }, []);

  return <InstallExperience />;
}
