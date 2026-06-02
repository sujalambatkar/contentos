"use client";

import { motion } from "framer-motion";
import { Mic2 } from "lucide-react";

interface ToneProfileProps {
  profile: {
    traits?: string[];
    vocabulary_level?: string;
    avg_sentence_length?: string;
    tone_descriptors?: string[];
    common_phrases?: string[];
  };
}

export default function ToneProfile({ profile }: ToneProfileProps) {
  if (!profile || Object.keys(profile).length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-2 rounded-xl border border-border p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Mic2 size={16} className="text-primary" />
        <h3 className="font-heading font-semibold text-sm text-warm">
          Detected Voice Profile
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Vocabulary</p>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs capitalize">
            {profile.vocabulary_level || "moderate"}
          </span>
        </div>
        <div>
          <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Sentence Length</p>
          <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs capitalize">
            {profile.avg_sentence_length || "medium"}
          </span>
        </div>
      </div>

      {profile.tone_descriptors && profile.tone_descriptors.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Tone</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.tone_descriptors.map((d, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 bg-surface border border-border rounded-full text-warm/70 capitalize"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.traits && profile.traits.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-muted mb-1.5 uppercase tracking-wider">Traits</p>
          <div className="space-y-1">
            {profile.traits.slice(0, 4).map((trait, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-warm/60">
                <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                {trait}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
