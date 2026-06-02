"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, CalendarPlus, ChevronDown, ChevronUp } from "lucide-react";
import toast from "react-hot-toast";

const PLATFORM_CONFIG: Record<
  string,
  { label: string; color: string; icon: string; borderColor: string }
> = {
  twitter: {
    label: "Twitter / X",
    color: "text-twitter",
    borderColor: "border-twitter",
    icon: "𝕏",
  },
  linkedin: {
    label: "LinkedIn",
    color: "text-linkedin",
    borderColor: "border-linkedin",
    icon: "in",
  },
  instagram: {
    label: "Instagram",
    color: "text-instagram",
    borderColor: "border-instagram",
    icon: "▲",
  },
  newsletter: {
    label: "Newsletter",
    color: "text-newsletter",
    borderColor: "border-newsletter",
    icon: "✉",
  },
  youtube: {
    label: "YouTube",
    color: "text-youtube",
    borderColor: "border-youtube",
    icon: "▶",
  },
};

interface PlatformCardProps {
  platform: string;
  content: Record<string, unknown>;
  schedule?: { times?: string[]; confidence?: number; reasoning?: string };
  onAddToCalendar?: () => void;
}

function TwitterContent({ content }: { content: Record<string, unknown> }) {
  const tweets = (content.tweets as string[]) || [];
  return (
    <div className="space-y-3">
      {tweets.map((tweet, i) => (
        <div
          key={i}
          className="bg-surface p-3 rounded-lg text-sm leading-relaxed"
        >
          <span className="text-muted text-xs mr-2">{i + 1}.</span>
          {tweet}
        </div>
      ))}
    </div>
  );
}

function LinkedInContent({ content }: { content: Record<string, unknown> }) {
  const [expanded, setExpanded] = useState(false);
  const article = (content.article as string) || "";
  const preview = article.slice(0, 300);

  return (
    <div className="space-y-2">
      {!!content.title && (
        <h4 className="font-heading font-semibold text-warm">
          {content.title as string}
        </h4>
      )}
      <p className="text-sm leading-relaxed text-warm/80">
        {expanded ? article : `${preview}...`}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp size={12} /> Show less
          </>
        ) : (
          <>
            <ChevronDown size={12} /> Read full article
          </>
        )}
      </button>
    </div>
  );
}

function InstagramContent({ content }: { content: Record<string, unknown> }) {
  const captions = (content.captions as Record<string, string>) || {};
  const hashtags = (content.hashtags as string[]) || [];
  const [selected, setSelected] = useState<"short" | "medium" | "long">("medium");

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(["short", "medium", "long"] as const).map((size) => (
          <button
            key={size}
            onClick={() => setSelected(size)}
            className={`text-xs px-3 py-1 rounded-full transition-all ${
              selected === size
                ? "bg-instagram text-white"
                : "bg-surface-2 text-muted hover:text-warm"
            }`}
          >
            {size}
          </button>
        ))}
      </div>
      <p className="text-sm leading-relaxed">{captions[selected]}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {hashtags.slice(0, 10).map((tag, i) => (
          <span key={i} className="text-xs text-instagram/80 bg-instagram/10 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function NewsletterContent({ content }: { content: Record<string, unknown> }) {
  const subjects = (content.subject_lines as string[]) || [];
  const [selectedSubject, setSelectedSubject] = useState(0);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Subject lines</p>
        <div className="space-y-1.5">
          {subjects.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedSubject(i)}
              className={`w-full text-left text-sm p-2 rounded-lg transition-all ${
                selectedSubject === i
                  ? "bg-newsletter/20 text-newsletter border border-newsletter/30"
                  : "bg-surface text-muted hover:text-warm"
              }`}
            >
              {String.fromCharCode(65 + i)}. {s}
            </button>
          ))}
        </div>
      </div>
      {!!content.preview_text && (
        <div>
          <p className="text-xs text-muted mb-1 uppercase tracking-wider">Preview text</p>
          <p className="text-xs text-warm/70 bg-surface p-2 rounded italic">
            {content.preview_text as string}
          </p>
        </div>
      )}
      <div>
        <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Body</p>
        <p className="text-sm leading-relaxed">{content.body as string}</p>
      </div>
    </div>
  );
}

function YouTubeContent({ content }: { content: Record<string, unknown> }) {
  const timestamps = (content.timestamps as Array<{ time: string; label: string }>) || [];
  const tags = (content.tags as string[]) || [];

  return (
    <div className="space-y-3">
      {!!content.title && (
        <div>
          <p className="text-xs text-muted mb-1 uppercase tracking-wider">Title</p>
          <h4 className="font-semibold text-warm">{content.title as string}</h4>
        </div>
      )}
      <div>
        <p className="text-xs text-muted mb-1 uppercase tracking-wider">Description</p>
        <p className="text-sm leading-relaxed text-warm/80">{content.description as string}</p>
      </div>
      {timestamps.length > 0 && (
        <div>
          <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Timestamps</p>
          <div className="space-y-1">
            {timestamps.map((t, i) => (
              <div key={i} className="flex gap-3 text-sm">
                <span className="text-youtube font-mono">{t.time}</span>
                <span className="text-warm/70">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        {tags.slice(0, 10).map((tag, i) => (
          <span key={i} className="text-xs bg-youtube/10 text-youtube/80 px-2 py-0.5 rounded-full">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function ContentRenderer({
  platform,
  content,
}: {
  platform: string;
  content: Record<string, unknown>;
}) {
  switch (platform) {
    case "twitter":
      return <TwitterContent content={content} />;
    case "linkedin":
      return <LinkedInContent content={content} />;
    case "instagram":
      return <InstagramContent content={content} />;
    case "newsletter":
      return <NewsletterContent content={content} />;
    case "youtube":
      return <YouTubeContent content={content} />;
    default:
      return <pre className="text-xs text-muted">{JSON.stringify(content, null, 2)}</pre>;
  }
}

export default function PlatformCard({
  platform,
  content,
  schedule,
  onAddToCalendar,
}: PlatformCardProps) {
  const [copied, setCopied] = useState(false);
  const config = PLATFORM_CONFIG[platform] || {
    label: platform,
    color: "text-primary",
    borderColor: "border-primary",
    icon: "●",
  };

  const getPlainText = () => {
    if (platform === "twitter") {
      return ((content.tweets as string[]) || []).join("\n\n");
    }
    if (platform === "linkedin") return (content.article as string) || "";
    if (platform === "instagram") {
      const caps = (content.captions as Record<string, string>) || {};
      return caps.medium || caps.long || "";
    }
    if (platform === "newsletter") return (content.body as string) || "";
    if (platform === "youtube") return (content.description as string) || "";
    return JSON.stringify(content, null, 2);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getPlainText());
    setCopied(true);
    toast.success(`${config.label} content copied!`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`bg-surface-2 rounded-xl border-l-4 ${config.borderColor} border border-border overflow-hidden`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold font-mono ${config.color}`}>
            {config.icon}
          </span>
          <span className={`font-heading font-semibold text-sm ${config.color}`}>
            {config.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {onAddToCalendar && (
            <button
              onClick={onAddToCalendar}
              className="p-1.5 rounded-lg text-muted hover:text-warm hover:bg-surface transition-all"
              title="Add to calendar"
            >
              <CalendarPlus size={14} />
            </button>
          )}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-muted hover:text-warm hover:bg-surface transition-all"
            title="Copy content"
          >
            {copied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <ContentRenderer platform={platform} content={content} />
      </div>

      {/* Schedule suggestion */}
      {schedule?.times && schedule.times.length > 0 && (
        <div className="px-4 py-2.5 bg-surface border-t border-border">
          <p className="text-xs text-muted">
            <span className="text-primary">Best times:</span>{" "}
            {schedule.times.join(" · ")}
            {schedule.confidence && (
              <span className="ml-2 text-warm/40">
                {Math.round(schedule.confidence * 100)}% confidence
              </span>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}
