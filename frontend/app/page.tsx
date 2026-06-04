"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuthStore } from "@/lib/store";
import {
  Zap, Upload, Sparkles, ArrowRight,
  FileText, LayoutGrid, Clock, CheckCircle, Mic2,
} from "lucide-react";

const PLATFORM_EXAMPLES = [
  {
    platform: "Twitter / X",
    color: "border-[#1d9bf0] text-[#1d9bf0]",
    bg: "bg-[#1d9bf0]/10",
    preview: "Building in public isn't a marketing strategy — it's an accountability system. Here's what three years of sharing everything taught me 🧵",
  },
  {
    platform: "LinkedIn",
    color: "border-[#0a66c2] text-[#0a66c2]",
    bg: "bg-[#0a66c2]/10",
    preview: "Three years ago I made a decision that changed how I build: I decided to share everything publicly — the wins, the failures, the embarrassing revenue screenshots...",
  },
  {
    platform: "Instagram",
    color: "border-[#e1306c] text-[#e1306c]",
    bg: "bg-[#e1306c]/10",
    preview: "The uncomfortable truth about building in public nobody tells you ↓\n\n#BuildInPublic #StartupLife #Founders #IndieHacker",
  },
  {
    platform: "Newsletter",
    color: "border-[#f59e0b] text-[#f59e0b]",
    bg: "bg-[#f59e0b]/10",
    preview: "Subject: Why I share my failures publicly (and why you should too)\n\nThis week I want to talk about something that made me uncomfortable for a long time...",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Paste your content",
    desc: "Drop in a video transcript, blog post, or raw notes. Upload a .txt, .md, or .pdf file — or just paste directly.",
    icon: Upload,
  },
  {
    step: "02",
    title: "AI parses & understands",
    desc: "The pipeline extracts key topics, hooks, and detects your writing voice from past uploads.",
    icon: Sparkles,
  },
  {
    step: "03",
    title: "5 agents run in parallel",
    desc: "Separate specialist agents for Twitter, LinkedIn, Instagram, Newsletter, and YouTube generate platform-native content simultaneously.",
    icon: Zap,
  },
  {
    step: "04",
    title: "Results stream back live",
    desc: "Each platform card appears the moment its agent finishes — no waiting for all five to complete before you see anything.",
    icon: ArrowRight,
  },
];

const USE_CASES = [
  {
    icon: "🎙️",
    title: "Podcast → Social",
    desc: "Record once. Paste the transcript. Get a Twitter thread, a LinkedIn post, and a newsletter section in under 3 minutes.",
  },
  {
    icon: "📝",
    title: "Blog post → Every platform",
    desc: "Your 1,500-word article becomes 5 platform-optimised formats without you rewriting a single sentence.",
  },
  {
    icon: "🎥",
    title: "YouTube video → Content calendar",
    desc: "Drop in a video transcript, schedule the repurposed content straight into the built-in editorial calendar.",
  },
  {
    icon: "🗒️",
    title: "Raw notes → Published content",
    desc: "Brain-dump your ideas. The AI structures, rewrites, and formats them for each audience — matching your voice.",
  },
  {
    icon: "🏢",
    title: "Thought leadership",
    desc: "Turn a single company update or insight into a coordinated multi-platform content drop.",
  },
  {
    icon: "🎓",
    title: "Educators & course creators",
    desc: "Convert lesson transcripts into shareable content that drives students back to your full course.",
  },
];

const FEATURES = [
  "Parallel AI agents — all platforms at once",
  "Real-time streaming output via SSE",
  "Voice calibration from your past content",
  "Drag-drop editorial calendar",
  "Twitter threads, LinkedIn articles, IG captions, newsletters, YouTube descriptions",
  "PDF, .txt, .md upload or direct paste",
  "Best-time posting suggestions per platform",
  "Full generation history",
];

export default function LandingPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated()) router.replace("/dashboard/upload");
  }, [isAuthenticated, router]);

  if (!mounted) return <div className="min-h-screen bg-background" />;
  if (isAuthenticated()) return null;

  return (
    <div className="min-h-screen bg-background text-warm">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-md border-b border-border flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-heading font-bold text-warm">ContentOS</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Link href="/login" className="text-sm text-muted hover:text-warm transition-colors">
            Sign in
          </Link>
          <Link
            href="/register"
            className="text-sm bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-lg font-medium transition-colors"
          >
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Sparkles size={12} />
              Powered by Groq · LangGraph · llama-3.3-70b
            </div>

            <h1 className="font-heading font-bold text-5xl md:text-6xl text-warm leading-tight mb-5">
              One piece of content.{" "}
              <span className="text-primary">Five platforms.</span>{" "}
              Three minutes.
            </h1>

            <p className="text-muted text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              Paste a video transcript, blog post, or raw notes. A multi-agent AI pipeline
              transforms it into a Twitter thread, LinkedIn article, Instagram captions,
              newsletter section, and YouTube description — all streaming back in real time.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-heading font-semibold px-6 py-3 rounded-xl transition-colors text-base"
              >
                Start repurposing free
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-surface text-warm border border-border px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Sign in to your workspace
              </Link>
            </div>

            <p className="text-xs text-muted mt-4">No credit card. No rate limits on your side. Free forever on the free tier.</p>
            <p className="text-xs text-muted/50 mt-2">
              Hosted on Render free tier — first request after inactivity takes ~30s to wake up. Subsequent requests are instant.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Platform output preview strip */}
      <section className="py-12 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs text-muted uppercase tracking-widest text-center mb-6">From one input, you get →</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {PLATFORM_EXAMPLES.map((ex, i) => (
              <motion.div
                key={ex.platform}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
                className={`rounded-xl border-l-4 border border-border ${ex.color} bg-surface-2 p-4`}
              >
                <p className={`text-xs font-heading font-semibold mb-2 ${ex.color.split(" ")[1]}`}>
                  {ex.platform}
                </p>
                <p className="text-xs text-warm/60 leading-relaxed line-clamp-5">{ex.preview}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl text-warm mb-2">How it works</h2>
            <p className="text-muted text-sm">Four steps. No configuration required.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="bg-surface-2 border border-border rounded-xl p-5 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-heading font-bold text-2xl text-primary/30">{step.step}</span>
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center ml-auto">
                      <step.icon size={15} className="text-primary" />
                    </div>
                  </div>
                  <h3 className="font-heading font-semibold text-warm text-sm mb-1.5">{step.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{step.desc}</p>
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent pipeline visual */}
      <section className="py-16 px-6 bg-surface/40 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading font-bold text-2xl text-warm mb-2">The agent pipeline</h2>
          <p className="text-muted text-sm mb-8">LangGraph orchestrates 7 agents — 5 run in parallel</p>

          <div className="bg-background rounded-2xl border border-border p-6 font-mono text-xs text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="ml-2 text-muted">pipeline</span>
            </div>
            {[
              { indent: 0, text: "Your input", color: "text-warm/60" },
              { indent: 1, text: "↓ parse_transcript  — topics · hooks · chunks", color: "text-primary" },
              { indent: 1, text: "↓ load_tone_profile — voice traits from your history", color: "text-primary" },
              { indent: 1, text: "↓ [parallel fan-out]", color: "text-muted" },
              { indent: 2, text: "├─ generate_twitter    → 7-tweet thread", color: "text-[#1d9bf0]" },
              { indent: 2, text: "├─ generate_linkedin   → 600-word article", color: "text-[#0a66c2]" },
              { indent: 2, text: "├─ generate_instagram  → 3 captions + hashtags", color: "text-[#e1306c]" },
              { indent: 2, text: "├─ generate_newsletter → subject lines + body", color: "text-[#f59e0b]" },
              { indent: 2, text: "└─ generate_youtube    → title + desc + timestamps", color: "text-[#ff0000]" },
              { indent: 1, text: "↓ suggest_schedule  — best posting times", color: "text-primary" },
              { indent: 1, text: "↓ SSE stream → your browser", color: "text-green-400" },
            ].map((line, i) => (
              <div key={i} className={`${line.color} leading-6`} style={{ paddingLeft: `${line.indent * 16}px` }}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-3xl text-warm mb-2">Who it's for</h2>
            <p className="text-muted text-sm">Anyone who creates content and hates doing the same work six times.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={uc.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-surface-2 border border-border rounded-xl p-5"
              >
                <div className="text-2xl mb-3">{uc.icon}</div>
                <h3 className="font-heading font-semibold text-warm text-sm mb-1.5">{uc.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features list */}
      <section className="py-16 px-6 bg-surface/40 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading font-bold text-2xl text-warm mb-8 text-center">Everything included</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5 text-sm text-warm/70">
                <CheckCircle size={14} className="text-primary flex-shrink-0 mt-0.5" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 border-t border-border text-center bg-grid relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent pointer-events-none" />
        <div className="relative max-w-xl mx-auto">
          <h2 className="font-heading font-bold text-4xl text-warm mb-3">
            Stop rewriting. Start repurposing.
          </h2>
          <p className="text-muted mb-7 text-sm">Free account. No credit card. Takes 30 seconds to set up.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-heading font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Create your free workspace
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 flex items-center justify-between text-xs text-muted">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
            <Zap size={11} className="text-white" />
          </div>
          <span>ContentOS</span>
        </div>
        <span>MIT License · Built with Groq + LangGraph + Next.js</span>
      </footer>
    </div>
  );
}
