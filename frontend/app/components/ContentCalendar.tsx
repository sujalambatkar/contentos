"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useContentStore } from "@/lib/store";
import { X, GripVertical } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["7am", "9am", "11am", "1pm", "3pm", "5pm", "7pm"];

const PLATFORM_CONFIG: Record<string, { label: string; colors: string; icon: string }> = {
  twitter:    { label: "Twitter / X",  icon: "𝕏",  colors: "bg-twitter/20 border-twitter/50 text-twitter"       },
  linkedin:   { label: "LinkedIn",     icon: "in", colors: "bg-linkedin/20 border-linkedin/50 text-linkedin"     },
  instagram:  { label: "Instagram",    icon: "▲",  colors: "bg-instagram/20 border-instagram/50 text-instagram"  },
  newsletter: { label: "Newsletter",   icon: "✉",  colors: "bg-newsletter/20 border-newsletter/50 text-newsletter"},
  youtube:    { label: "YouTube",      icon: "▶",  colors: "bg-youtube/20 border-youtube/50 text-youtube"        },
};

interface DragPayload {
  type: "new" | "move";
  platform: string;
  content: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  sourceSlot?: string;
}

export default function ContentCalendar() {
  const { calendarSlots, addToCalendar, removeFromCalendar, currentJob } = useContentStore();
  const [overSlot, setOverSlot] = useState<string | null>(null);

  const slotKey = (day: string, time: string) => `${day} ${time}`;

  const totalScheduled = Object.values(calendarSlots).reduce(
    (sum, items) => sum + items.length,
    0
  );

  // Items available to schedule = currentJob outputs not yet in any slot
  const scheduledPlatforms = new Set(
    Object.values(calendarSlots).flatMap((items) => items.map((i) => i.platform))
  );
  const availableOutputs = (currentJob?.outputs ?? []).filter(
    (o) => !scheduledPlatforms.has(o.platform)
  );

  // ── Drag handlers ────────────────────────────────────────────────────────

  const onDragStartNew = (
    e: React.DragEvent,
    output: { platform: string; content: Record<string, unknown>; schedule?: Record<string, unknown> }
  ) => {
    const payload: DragPayload = {
      type: "new",
      platform: output.platform,
      content: output.content,
      schedule: output.schedule,
    };
    e.dataTransfer.setData("application/contentos", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  const onDragStartMove = (
    e: React.DragEvent,
    item: { platform: string; content: Record<string, unknown>; schedule?: Record<string, unknown> },
    sourceSlot: string
  ) => {
    const payload: DragPayload = {
      type: "move",
      platform: item.platform,
      content: item.content,
      schedule: item.schedule,
      sourceSlot,
    };
    e.dataTransfer.setData("application/contentos", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.effectAllowed === "copy" ? "copy" : "move";
    setOverSlot(key);
  };

  const onDrop = (e: React.DragEvent, day: string, time: string) => {
    e.preventDefault();
    setOverSlot(null);
    const raw = e.dataTransfer.getData("application/contentos");
    if (!raw) return;

    let payload: DragPayload;
    try { payload = JSON.parse(raw); } catch { return; }

    const target = slotKey(day, time);

    if (payload.type === "new") {
      addToCalendar(target, {
        platform: payload.platform,
        content: payload.content,
        schedule: payload.schedule,
        status: "complete",
      });
    } else if (payload.type === "move" && payload.sourceSlot !== target) {
      removeFromCalendar(payload.sourceSlot!, payload.platform);
      addToCalendar(target, {
        platform: payload.platform,
        content: payload.content,
        schedule: payload.schedule,
        status: "complete",
      });
    }
  };

  return (
    <div className="space-y-6">

      {/* Draggable source panel */}
      <div>
        <p className="text-xs text-muted uppercase tracking-wider mb-3">
          {availableOutputs.length > 0
            ? "Drag any card below onto a time slot"
            : currentJob?.outputs && currentJob.outputs.length > 0
            ? "All generated content is already scheduled"
            : "Generate content on the Create page first, then drag it here"}
        </p>

        <div className="flex flex-wrap gap-2 min-h-[44px]">
          <AnimatePresence>
            {availableOutputs.map((output) => {
              const cfg = PLATFORM_CONFIG[output.platform] ?? {
                label: output.platform, icon: "●",
                colors: "bg-primary/20 border-primary/50 text-primary",
              };
              return (
                <motion.div
                  key={output.platform}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <div
                    draggable
                    onDragStart={(e: React.DragEvent) => onDragStartNew(e, output)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium
                      cursor-grab active:cursor-grabbing select-none ${cfg.colors}`}
                  >
                    <GripVertical size={12} className="opacity-50" />
                    <span className="font-mono text-xs">{cfg.icon}</span>
                    {cfg.label}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {availableOutputs.length === 0 && !currentJob?.outputs?.length && (
            <div className="h-11 w-full rounded-xl border border-dashed border-border flex items-center px-4">
              <span className="text-xs text-muted/50">No content yet</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      {totalScheduled > 0 && (
        <p className="text-xs text-muted">
          {totalScheduled} piece{totalScheduled !== 1 ? "s" : ""} scheduled
          {" · "}
          <button
            onClick={() => {
              Object.keys(calendarSlots).forEach((slot) => {
                (calendarSlots[slot] || []).forEach((item) =>
                  removeFromCalendar(slot, item.platform)
                );
              });
            }}
            className="text-red-400/60 hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
        </p>
      )}

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr>
              <th className="w-16 bg-surface/80 border-b border-r border-border p-2" />
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="bg-surface/80 border-b border-r border-border px-3 py-2.5 text-xs
                    font-heading font-semibold text-muted uppercase tracking-wider text-center"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr key={time}>
                <td className="bg-surface/40 border-r border-b border-border px-2 py-2
                  text-xs text-muted text-right font-mono whitespace-nowrap">
                  {time}
                </td>
                {DAYS.map((day) => {
                  const key = slotKey(day, time);
                  const items = calendarSlots[key] ?? [];
                  const isOver = overSlot === key;

                  return (
                    <td
                      key={key}
                      onDragOver={(e) => onDragOver(e, key)}
                      onDragLeave={() => setOverSlot(null)}
                      onDrop={(e) => onDrop(e, day, time)}
                      className={`border-r border-b border-border p-1.5 min-h-[52px] align-top
                        transition-colors duration-100 ${
                          isOver
                            ? "bg-primary/15 ring-1 ring-inset ring-primary/40"
                            : "bg-surface-2/30 hover:bg-surface/40"
                        }`}
                    >
                      <div className="space-y-1">
                        <AnimatePresence>
                          {items.map((item) => {
                            const cfg = PLATFORM_CONFIG[item.platform] ?? {
                              label: item.platform, icon: "●",
                              colors: "bg-primary/20 border-primary/50 text-primary",
                            };
                            return (
                              <motion.div
                                key={item.platform}
                                initial={{ opacity: 0, scale: 0.85 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.85 }}
                              >
                                <div
                                  draggable
                                  onDragStart={(e: React.DragEvent) => onDragStartMove(e, item, key)}
                                  className={`flex items-center justify-between gap-1 px-1.5 py-1
                                    rounded-md border text-xs cursor-grab active:cursor-grabbing
                                    select-none ${cfg.colors}`}
                                >
                                  <span className="truncate">
                                    {cfg.icon} {cfg.label}
                                  </span>
                                  <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={() => removeFromCalendar(key, item.platform)}
                                    className="flex-shrink-0 opacity-50 hover:opacity-100 ml-0.5"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
