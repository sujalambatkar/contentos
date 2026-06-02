"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, ChevronDown } from "lucide-react";
import { contentAPI } from "@/lib/api";
import { useContentStore } from "@/lib/store";
import UploadZone from "@/app/components/UploadZone";
import StreamingOutput from "@/app/components/StreamingOutput";
import ToneProfile from "@/app/components/ToneProfile";
import toast from "react-hot-toast";

const PLATFORMS = [
  { id: "twitter",     label: "Twitter / X",  icon: "𝕏",  color: "text-twitter border-twitter bg-twitter/10"   },
  { id: "linkedin",    label: "LinkedIn",      icon: "in", color: "text-linkedin border-linkedin bg-linkedin/10" },
  { id: "instagram",   label: "Instagram",     icon: "▲",  color: "text-instagram border-instagram bg-instagram/10" },
  { id: "newsletter",  label: "Newsletter",    icon: "✉",  color: "text-newsletter border-newsletter bg-newsletter/10" },
  { id: "youtube",     label: "YouTube",       icon: "▶",  color: "text-youtube border-youtube bg-youtube/10"   },
];

const INPUT_TYPES = [
  { id: "transcript", label: "Video transcript" },
  { id: "blog",       label: "Blog post" },
  { id: "notes",      label: "Raw notes" },
];

export default function UploadPage() {
  const [inputText, setInputText] = useState("");
  const [inputType, setInputType] = useState<"transcript" | "blog" | "notes">("transcript");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    PLATFORMS.map((p) => p.id)
  );
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { clearJob, currentJob } = useContentStore();

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (inputText.trim().length < 50) {
      toast.error("Please add at least 50 characters of content");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    setIsSubmitting(true);
    clearJob();
    setJobId(null);

    try {
      const res = await contentAPI.process({
        input_text: inputText,
        input_type: inputType,
        platforms: selectedPlatforms,
      });
      setJobId(res.data.job_id);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Failed to start generation";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setJobId(null);
    clearJob();
    setInputText("");
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading font-bold text-3xl text-warm mb-1.5">
            Create Content
          </h1>
          <p className="text-muted text-sm">
            Drop a transcript, paste a blog post, or add raw notes — the AI
            handles the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 items-start">
          {/* Left: input panel */}
          <div className="space-y-5">
            {/* Input type switcher */}
            <div className="flex gap-2">
              {INPUT_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setInputType(t.id as typeof inputType)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-all ${
                    inputType === t.id
                      ? "bg-primary text-white font-medium"
                      : "bg-surface-2 text-muted hover:text-warm border border-border"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <UploadZone
              value={inputText}
              onChange={setInputText}
              inputType={inputType}
            />

            {/* Platform selector */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs text-muted uppercase tracking-wider">
                  Output platforms
                </p>
                <button
                  onClick={() =>
                    setSelectedPlatforms(
                      selectedPlatforms.length === PLATFORMS.length
                        ? []
                        : PLATFORMS.map((p) => p.id)
                    )
                  }
                  className="text-xs text-primary hover:text-primary-hover"
                >
                  {selectedPlatforms.length === PLATFORMS.length
                    ? "Deselect all"
                    : "Select all"}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        active
                          ? p.color
                          : "bg-surface text-muted border-border hover:border-warm/20"
                      }`}
                    >
                      <span className="font-mono text-xs">{p.icon}</span>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-400/80 leading-relaxed">
              <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
              <span>
                <strong className="text-amber-400 font-medium">Free tier notice:</strong>{" "}
                This app runs on Groq's free API which has rate limits. Generating all 5 platforms
                takes <strong className="text-amber-400/90">1.5 – 3 minutes</strong> — platforms stream
                in one by one as they complete. Select fewer platforms for faster results.
                Content is AI-generated; always review before publishing.
              </span>
            </div>

            {/* Generate button */}
            <div className="flex gap-3">
              <button
                onClick={handleGenerate}
                disabled={isSubmitting || !!jobId}
                className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-heading font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Starting pipeline…
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Content
                  </>
                )}
              </button>
              {jobId && (
                <button
                  onClick={handleReset}
                  className="px-5 py-3.5 rounded-xl border border-border text-muted hover:text-warm hover:border-warm/30 transition-all text-sm"
                >
                  New
                </button>
              )}
            </div>
          </div>

          {/* Right: streaming output */}
          <div className="space-y-5">
            {/* Tone profile (shows after generation) */}
            {currentJob?.toneProfile &&
              Object.keys(currentJob.toneProfile).length > 0 && (
                <ToneProfile
                  profile={
                    currentJob.toneProfile as {
                      traits?: string[];
                      vocabulary_level?: string;
                      avg_sentence_length?: string;
                      tone_descriptors?: string[];
                      common_phrases?: string[];
                    }
                  }
                />
              )}

            <AnimatePresence>
              {jobId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading font-semibold text-warm">
                      Generated Output
                    </h2>
                    {currentJob?.status === "complete" && (
                      <span className="text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                        Complete
                      </span>
                    )}
                  </div>
                  <StreamingOutput
                    jobId={jobId}
                    requestedPlatforms={selectedPlatforms}
                    onComplete={() =>
                      toast.success("All platforms generated!")
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Empty state */}
            {!jobId && (
              <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-3 rounded-2xl border border-dashed border-border p-8">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary" />
                </div>
                <p className="text-muted text-sm max-w-[200px]">
                  Generated platform content will stream in here as each agent
                  completes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
