"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Trash2,
  RefreshCw,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import { contentAPI, HistoryItem } from "@/lib/api";
import { useContentStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-twitter/15 text-twitter",
  linkedin: "bg-linkedin/15 text-linkedin",
  instagram: "bg-instagram/15 text-instagram",
  newsletter: "bg-newsletter/15 text-newsletter",
  youtube: "bg-youtube/15 text-youtube",
};

const INPUT_TYPE_LABELS: Record<string, string> = {
  transcript: "Video Transcript",
  blog: "Blog Post",
  notes: "Raw Notes",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function HistoryPage() {
  const router = useRouter();
  const { setJob, clearJob } = useContentStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await contentAPI.history();
      setHistory(res.data.history);
    } catch {
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDelete = async (jobId: string) => {
    setDeletingId(jobId);
    try {
      await contentAPI.deleteHistory(jobId);
      setHistory((prev) => prev.filter((h) => h.job_id !== jobId));
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRegenerate = (item: HistoryItem) => {
    clearJob();
    router.push(
      `/dashboard/upload?prefill=${encodeURIComponent(item.job_id)}`
    );
  };

  const handleView = async (jobId: string) => {
    try {
      const res = await contentAPI.historyItem(jobId);
      const job = res.data;
      setJob({
        jobId: job.job_id,
        status: "complete",
        outputs: Object.entries(job.platform_outputs || {}).map(
          ([platform, content]) => ({
            platform,
            content: content as Record<string, unknown>,
            status: "complete",
          })
        ),
        topics: job.topics || [],
        hooks: job.hooks || [],
        toneProfile: job.tone_profile || {},
      });
      router.push("/dashboard/upload");
    } catch {
      toast.error("Failed to load job");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl text-warm mb-1.5">
              History
            </h1>
            <p className="text-muted text-sm">
              Past content generations — view, copy, or regenerate.
            </p>
          </div>
          <button
            onClick={loadHistory}
            className="p-2 rounded-lg text-muted hover:text-warm hover:bg-surface-2 transition-all"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center h-48 text-muted">
            <Loader2 size={20} className="animate-spin mr-2" />
            Loading history…
          </div>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center">
              <Clock size={20} className="text-muted" />
            </div>
            <p className="text-muted">No history yet.</p>
            <a
              href="/dashboard/upload"
              className="text-primary text-sm hover:text-primary-hover underline underline-offset-2"
            >
              Create your first content
            </a>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {history.map((item, i) => (
                <motion.div
                  key={item.job_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-surface-2 border border-border rounded-xl p-5 hover:border-border/80 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={16} className="text-primary" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted">
                          {INPUT_TYPE_LABELS[item.input_type] || item.input_type}
                        </span>
                        <span className="text-muted/30">·</span>
                        <span className="text-xs text-muted">
                          {timeAgo(item.created_at)}
                        </span>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ml-auto sm:ml-0 ${
                            item.status === "complete"
                              ? "bg-green-400/10 text-green-400"
                              : "bg-yellow-400/10 text-yellow-400"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-warm/70 line-clamp-2 mb-2">
                        {item.preview}
                      </p>

                      {/* Topics */}
                      {item.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {item.topics.slice(0, 4).map((t, j) => (
                            <span
                              key={j}
                              className="text-xs px-2 py-0.5 bg-primary/10 text-primary/80 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Platforms */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.completed_platforms.map((p) => (
                          <span
                            key={p}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              PLATFORM_COLORS[p] || "bg-surface text-muted"
                            }`}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleView(item.job_id)}
                        className="p-2 rounded-lg text-muted hover:text-warm hover:bg-surface transition-all"
                        title="View outputs"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={() => handleRegenerate(item)}
                        className="p-2 rounded-lg text-muted hover:text-primary hover:bg-primary/10 transition-all"
                        title="Regenerate"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.job_id)}
                        disabled={deletingId === item.job_id}
                        className="p-2 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-all"
                        title="Delete"
                      >
                        {deletingId === item.job_id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
