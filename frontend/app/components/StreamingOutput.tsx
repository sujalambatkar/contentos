"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, AlertCircle } from "lucide-react";
import { useSSE } from "@/lib/sse";
import { useContentStore } from "@/lib/store";
import PlatformCard from "./PlatformCard";
import toast from "react-hot-toast";

interface StreamingOutputProps {
  jobId: string | null;
  requestedPlatforms: string[];
  onComplete?: () => void;
}

// Maps a schedule suggestion like "Tue 9am EST" or "Wed 12pm" to the
// nearest valid calendar slot key ("Tue 9am", "Wed 1pm", etc.)
const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VALID_TIMES = ["7am", "9am", "11am", "1pm", "3pm", "5pm", "7pm"];
const TIME_TO_HOUR: Record<string, number> = {
  "7am": 7, "9am": 9, "11am": 11, "1pm": 13, "3pm": 15, "5pm": 17, "7pm": 19,
};

function toCalendarSlot(raw: string): string {
  const parts = raw.trim().split(/\s+/);

  // Normalise day
  const dayRaw = (parts[0] ?? "Mon").slice(0, 3);
  const day = VALID_DAYS.find(
    (d) => d.toLowerCase() === dayRaw.toLowerCase()
  ) ?? "Mon";

  // Parse time — e.g. "9am", "12pm", "3pm", strip any trailing timezone
  const timeRaw = (parts[1] ?? "9am").replace(/[^0-9apm]/gi, "").toLowerCase();
  const match = timeRaw.match(/^(\d+)(am|pm)$/);
  let hour = 9;
  if (match) {
    let h = parseInt(match[1], 10);
    if (match[2] === "pm" && h !== 12) h += 12;
    if (match[2] === "am" && h === 12) h = 0;
    hour = h;
  }

  // Nearest valid slot by hour distance
  const nearest = VALID_TIMES.reduce((best, t) =>
    Math.abs(TIME_TO_HOUR[t] - hour) < Math.abs(TIME_TO_HOUR[best] - hour)
      ? t
      : best
  );

  return `${day} ${nearest}`;
}

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "Twitter / X",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  newsletter: "Newsletter",
  youtube: "YouTube",
};

export default function StreamingOutput({
  jobId,
  requestedPlatforms,
  onComplete,
}: StreamingOutputProps) {
  const { currentJob, addOutput, updateJobStatus, setJob } = useContentStore();

  useEffect(() => {
    if (jobId && !currentJob) {
      setJob({
        jobId,
        status: "processing",
        outputs: [],
        topics: [],
        hooks: [],
        toneProfile: {},
      });
    }
  }, [jobId, currentJob, setJob]);

  useSSE(jobId, {
    onPlatformOutput: (event) => {
      if (event.platform && event.content) {
        addOutput({
          platform: event.platform,
          content: event.content,
          schedule: event.schedule as Record<string, unknown> | undefined,
          status: "complete",
        });
      }
    },
    onMeta: (event) => {
      if (currentJob) {
        useContentStore.setState((state) => ({
          currentJob: state.currentJob
            ? {
                ...state.currentJob,
                topics: event.topics || [],
                hooks: event.hooks || [],
                toneProfile: event.tone_profile || {},
              }
            : null,
        }));
      }
    },
    onError: (err) => {
      updateJobStatus("error");
      toast.error(`Generation failed: ${err}`);
    },
    onDone: () => {
      updateJobStatus("complete");
      onComplete?.();
    },
  });

  const outputs = currentJob?.outputs || [];
  const completedSet = new Set(outputs.map((o) => o.platform));
  const pendingPlatforms = requestedPlatforms.filter(
    (p) => !completedSet.has(p)
  );
  const isProcessing = currentJob?.status === "processing";

  if (!jobId) return null;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl"
        >
          <Loader2 size={16} className="text-primary animate-spin" />
          <span className="text-sm text-warm/80">
            Generating{" "}
            {pendingPlatforms.length > 0
              ? pendingPlatforms
                  .map((p) => PLATFORM_LABELS[p] || p)
                  .join(", ")
              : "content"}
            …
          </span>
          <span className="ml-auto text-xs text-muted">
            {outputs.length}/{requestedPlatforms.length} complete
          </span>
        </motion.div>
      )}

      {/* Completed cards */}
      <AnimatePresence mode="popLayout">
        {outputs.map((output) => (
          <PlatformCard
            key={output.platform}
            platform={output.platform}
            content={output.content}
            schedule={
              output.schedule as
                | { times?: string[]; confidence?: number; reasoning?: string }
                | undefined
            }
            onAddToCalendar={() => {
              const rawTime =
                (output.schedule?.times as string[] | undefined)?.[0] ?? "Mon 9am";
              const slot = toCalendarSlot(rawTime);
              useContentStore.getState().addToCalendar(slot, output);
              toast.success(
                `${PLATFORM_LABELS[output.platform]} added to ${slot}`
              );
            }}
          />
        ))}
      </AnimatePresence>

      {/* Pending skeleton cards */}
      {isProcessing &&
        pendingPlatforms.map((platform, i) => {
          // After 90s assume it timed out on the free tier
          const likelyTimedOut = false; // backend handles timeout, SSE will report done
          return (
            <motion.div
              key={`pending-${platform}`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
              className="bg-surface-2 rounded-xl border border-border/50 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                <Zap size={14} className="text-muted" />
                <span className="text-muted text-sm">
                  {PLATFORM_LABELS[platform] || platform}
                </span>
                <span className="ml-auto text-xs text-muted/50 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" /> generating…
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="h-3 bg-surface rounded w-3/4 animate-pulse" />
                <div className="h-3 bg-surface rounded w-full animate-pulse" />
                <div className="h-3 bg-surface rounded w-2/3 animate-pulse" />
              </div>
              <div className="px-4 py-2 border-t border-border/30">
                <p className="text-xs text-muted/50">
                  Groq free tier — may take 20–40s per platform
                </p>
              </div>
            </motion.div>
          );
        })}

      {/* Topics strip (once available) */}
      {currentJob?.topics && currentJob.topics.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-wrap gap-2 pt-2"
        >
          {currentJob.topics.map((topic, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full"
            >
              {topic}
            </span>
          ))}
        </motion.div>
      )}
    </div>
  );
}
