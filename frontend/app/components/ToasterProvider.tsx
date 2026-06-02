"use client";

import { Toaster } from "react-hot-toast";

// Isolated to a client component so it never causes SSR hydration mismatch
export default function ToasterProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#161b27",
          color: "#f8f7f4",
          border: "1px solid #2a3040",
          fontFamily: "DM Sans, sans-serif",
        },
      }}
    />
  );
}
