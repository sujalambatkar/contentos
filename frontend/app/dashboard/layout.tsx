"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import Navbar from "@/app/components/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated()) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  // On first render (server + client pre-hydration) render the same empty shell
  // so server and client HTML match — avoids the hydration mismatch
  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-14">{children}</main>
    </div>
  );
}
