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

const DEMO_SAMPLES: {
  id: string;
  label: string;
  type: "transcript" | "blog" | "notes";
  description: string;
  text: string;
}[] = [
  {
    id: "transcript",
    label: "Video transcript",
    type: "transcript",
    description: "Building in Public — SaaS founder advice",
    text: `Hey everyone, welcome back. Today we're talking about something I wish someone had told me three years ago when I started building my first SaaS product — and that's the concept of building in public.

So what does building in public actually mean? It means you share your progress, your failures, your revenue numbers, your mistakes — all of it — with your audience as you're building. You tweet about what you shipped this week. You write a blog post about why you almost gave up. You post your MRR screenshot even when the number is embarrassing.

Now here's the thing most people get wrong. They think building in public is a marketing strategy. It's not. Or at least it shouldn't be. The real value is the accountability it creates for yourself, and the genuine community it attracts around your work.

Let me give you three concrete reasons why you should consider it.

Number one: it forces clarity. When you have to explain what you're building to a stranger on the internet, you suddenly realize how fuzzy your own thinking is. I can't tell you how many times I've started writing a tweet about a feature and realized mid-sentence that I didn't actually understand why I was building it.

Number two: distribution before launch. The biggest problem for indie hackers and solo founders is that they build something great and then nobody shows up on launch day. Building in public solves this because you're growing an audience of people who are already invested in your story before you ever have a product to sell.

Number three: feedback loops. When I share a wireframe or a rough prototype publicly, I get honest feedback within hours. Not polished, diplomatic feedback from friends who don't want to hurt your feelings — real, sometimes brutal, always useful feedback from people who have no reason to lie to you.

The downside? You're going to feel exposed. You're going to ship something broken and fifty people are going to see it. You're going to post a revenue update that's lower than last month and feel like a fraud. That vulnerability is uncomfortable. But it's also exactly what builds trust with an audience over the long term.

My advice: start small. You don't have to share your revenue. You don't have to share your failures immediately. Just start sharing what you're working on this week. One tweet, three times a week. That's it. The habit compounds faster than you think.

If you found this useful, subscribe to the newsletter — I send a weekly breakdown of what I'm building, what's working, and what isn't. Link is in the description. See you next week.`,
  },
  {
    id: "blog",
    label: "Blog post",
    type: "blog",
    description: "The Productivity Myth Nobody Talks About",
    text: `The Productivity Myth Nobody Talks About

We've been sold a lie about productivity. The lie goes something like this: if you wake up earlier, use the right apps, follow the right system, and optimize your mornings, you'll finally get everything done. The productivity industrial complex — worth billions of dollars — depends on you believing this.

Here's what actually happens. You buy the app. You build the system. You wake up at 5am for two weeks. And then life gets in the way, the system collapses, and you feel worse than before because now you're not just unproductive — you're a failure at being productive.

The real problem isn't your system. It's your relationship with the work itself.

Most productivity advice treats the human brain like a CPU that just needs the right software. But the research tells a different story. A study from the University of California Irvine found that it takes an average of 23 minutes to fully regain focus after an interruption. No app fixes that. Cal Newport's research on deep work shows that most knowledge workers spend less than four hours per day on cognitively demanding tasks — not because they're lazy, but because the modern work environment is structurally hostile to concentration.

So what actually works?

First, shrink your to-do list ruthlessly. MIT researcher productivity research consistently shows that people overestimate what they can do in a day and underestimate what they can do in a year. Pick three things — maximum — that actually matter today. Not twelve. Three. If you finish three meaningful things, that's a genuinely productive day.

Second, protect your mornings from other people's priorities. Email, Slack, social media — these are all other people asking things of you. Do your own most important work first, before you open any of them. Even 90 minutes of uninterrupted morning work compounds enormously over a year.

Third, design for recovery, not just output. Athletes don't train at maximum intensity every day — they periodize their effort. Your brain needs the same thing. Schedule genuine rest, not guilty scrolling.

The uncomfortable truth is that sustainable productivity isn't a hack. It's a practice of knowing what matters to you, protecting time for it, and accepting that some days you'll fall short. The goal is the trend line, not any individual day.

Stop optimizing. Start choosing.`,
  },
  {
    id: "notes",
    label: "Raw notes",
    type: "notes",
    description: "AI and the future of work — reading notes",
    text: `Notes from reading about AI and the future of work - December 2025

- 40% of jobs could be automated by 2030 according to McKinsey report
- but same report says 97 million new roles could emerge
- the jobs that survive aren't the ones that are hard to automate - they're the ones humans WANT to do with other humans
- doctors, therapists, teachers, coaches - not going away
- key insight: AI is great at tasks, humans are great at RELATIONSHIPS
- the economic value is shifting from information to judgment
- anyone can get the same information from ChatGPT - what you're paying for now is someone's judgment, taste, curation
- implications for creators: your opinion, your perspective, your lived experience is MORE valuable now not less
- skill that matters most going forward: asking better questions
- prompt engineering as metaphor - if you can describe what you want precisely, you can get it built by AI
- this applies to management, to creative direction, to strategy
- the people who will thrive: those who can work WITH AI tools fluently AND bring something irreplaceably human
- what's irreplaceable: emotional intelligence, moral reasoning, physical presence, creative taste, cultural context
- scary stat: 70% of workers in a recent survey say they haven't used any AI tools in the last month
- the divide isn't going to be AI vs humans - it's going to be AI-augmented humans vs non-augmented humans
- action items for individuals: learn one new AI tool per month, document your unique perspective/expertise, build in public
- companies need to stop treating AI as a cost-cutting tool and start treating it as a capability multiplier
- the orgs that will win are those that figure out the human-AI collaboration model fastest`,
  },
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

  const handleLoadSample = (sample: typeof DEMO_SAMPLES[0]) => {
    handleReset();
    setInputType(sample.type);
    setInputText(sample.text);
    toast.success(`Loaded: ${sample.description}`);
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="font-heading font-bold text-3xl text-warm mb-1.5">
            Create Content
          </h1>
          <p className="text-muted text-sm">
            Drop a transcript, paste a blog post, or add raw notes — the AI
            handles the rest.
          </p>
        </div>

        {/* Demo samples */}
        <div className="mb-7 p-4 rounded-xl bg-surface-2 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">
            Try a sample — one click loads real content and runs the full pipeline
          </p>
          <div className="flex flex-wrap gap-2">
            {DEMO_SAMPLES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleLoadSample(sample)}
                disabled={isSubmitting || !!jobId}
                className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-lg bg-surface
                  border border-border hover:border-primary/40 hover:bg-primary/5
                  transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <span className="text-xs font-mono text-primary mt-0.5">▶</span>
                <div>
                  <p className="text-xs font-medium text-warm group-hover:text-primary transition-colors">
                    {sample.description}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{sample.label}</p>
                </div>
              </button>
            ))}
          </div>
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
