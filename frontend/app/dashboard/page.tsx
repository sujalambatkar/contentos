"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Info } from "lucide-react";
import ContentCalendar from "@/app/components/ContentCalendar";
import { useContentStore } from "@/lib/store";

export default function DashboardPage() {
  const { currentJob, calendarSlots } = useContentStore();
  const totalScheduled = Object.values(calendarSlots).reduce(
    (s, items) => s + items.length,
    0
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl text-warm mb-1.5 flex items-center gap-2">
              <CalendarDays size={26} className="text-primary" />
              Editorial Calendar
            </h1>
            <p className="text-muted text-sm">
              Drag generated content onto time slots to build your posting schedule.
            </p>
          </div>

          {totalScheduled > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-right"
            >
              <p className="text-2xl font-heading font-bold text-warm">
                {totalScheduled}
              </p>
              <p className="text-xs text-muted">pieces scheduled</p>
            </motion.div>
          )}
        </div>

        {/* Hint when nothing scheduled */}
        {totalScheduled === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 bg-primary/5 border border-primary/15 rounded-xl p-4 mb-6 text-sm"
          >
            <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-warm/80">
                Go to{" "}
                <a href="/dashboard/upload" className="text-primary underline underline-offset-2">
                  Create
                </a>{" "}
                to generate content, then click{" "}
                <span className="font-mono bg-surface px-1.5 py-0.5 rounded text-xs">
                  Add to calendar
                </span>{" "}
                on any platform card. It will appear here and you can drag it to any
                time slot.
              </p>
            </div>
          </motion.div>
        )}

        <ContentCalendar />

        {/* Current job summary */}
        {currentJob?.topics && currentJob.topics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-5 bg-surface-2 border border-border rounded-xl"
          >
            <p className="text-xs text-muted uppercase tracking-wider mb-3">
              Last job topics
            </p>
            <div className="flex flex-wrap gap-2">
              {currentJob.topics.map((t, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full"
                >
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
