"use client";

import { motion } from "framer-motion";
import { CalendarDays, ArrowRight } from "lucide-react";
import Link from "next/link";
import ContentCalendar from "@/app/components/ContentCalendar";
import { useContentStore } from "@/lib/store";

export default function DashboardPage() {
  const { currentJob } = useContentStore();
  const hasOutputs = (currentJob?.outputs?.length ?? 0) > 0;

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
              {hasOutputs
                ? "Drag the content chips below onto any day and time slot."
                : "Generate content on the Create page, then come back here to schedule it."}
            </p>
          </div>

          {!hasOutputs && (
            <Link
              href="/dashboard/upload"
              className="flex items-center gap-2 text-sm bg-primary hover:bg-primary-hover
                text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Create content
              <ArrowRight size={14} />
            </Link>
          )}
        </div>

        <ContentCalendar />

        {/* Topics strip from last job */}
        {currentJob?.topics && currentJob.topics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-5 bg-surface-2 border border-border rounded-xl"
          >
            <p className="text-xs text-muted uppercase tracking-wider mb-3">
              Topics from last generation
            </p>
            <div className="flex flex-wrap gap-2">
              {currentJob.topics.map((t, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 bg-primary/10 text-primary
                    border border-primary/20 rounded-full"
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
