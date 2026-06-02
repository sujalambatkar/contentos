"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Upload, LayoutGrid, Clock, LogOut, User } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import toast from "react-hot-toast";

const NAV_ITEMS = [
  { href: "/dashboard/upload", label: "Create", icon: Upload },
  { href: "/dashboard", label: "Calendar", icon: LayoutGrid },
  { href: "/dashboard/history", label: "History", icon: Clock },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Signed out");
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-surface/80 backdrop-blur-md border-b border-border flex items-center px-6 gap-4">
      {/* Logo */}
      <Link href="/dashboard/upload" className="flex items-center gap-2 mr-4">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Zap size={15} className="text-white" />
        </div>
        <span className="font-heading font-bold text-warm text-base">ContentOS</span>
      </Link>

      {/* Nav links */}
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                active ? "text-warm" : "text-muted hover:text-warm"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 bg-surface-2 border border-border rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon size={14} className="relative z-10" />
              <span className="relative z-10">{label}</span>
            </Link>
          );
        })}
      </div>

      {/* Right: user */}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2 text-muted text-sm">
            <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              <User size={12} className="text-primary" />
            </div>
            <span className="hidden sm:block">{user.name}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="p-1.5 text-muted hover:text-warm rounded-lg hover:bg-surface-2 transition-all"
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </nav>
  );
}
