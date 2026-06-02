"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useContentStore } from "@/lib/store";
import { X } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_SLOTS = ["7am", "9am", "11am", "1pm", "3pm", "5pm", "7pm"];

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "bg-twitter/20 border-twitter text-twitter",
  linkedin: "bg-linkedin/20 border-linkedin text-linkedin",
  instagram: "bg-instagram/20 border-instagram text-instagram",
  newsletter: "bg-newsletter/20 border-newsletter text-newsletter",
  youtube: "bg-youtube/20 border-youtube text-youtube",
};

const PLATFORM_LABELS: Record<string, string> = {
  twitter: "𝕏 Twitter",
  linkedin: "in LinkedIn",
  instagram: "▲ Instagram",
  newsletter: "✉ Newsletter",
  youtube: "▶ YouTube",
};

interface DragItem {
  platform: string;
  sourceSlot: string;
}

export default function ContentCalendar() {
  const { calendarSlots, addToCalendar, removeFromCalendar } = useContentStore();
  const [dragging, setDragging] = useState<DragItem | null>(null);
  const [overSlot, setOverSlot] = useState<string | null>(null);

  const slotKey = (day: string, time: string) => `${day} ${time}`;

  const handleDragStart = (platform: string, sourceSlot: string) => {
    setDragging({ platform, sourceSlot });
  };

  const handleDrop = (day: string, time: string) => {
    if (!dragging) return;
    const target = slotKey(day, time);
    if (target === dragging.sourceSlot) {
      setDragging(null);
      setOverSlot(null);
      return;
    }
    // Move: remove from source, add to target
    const sourceItems = calendarSlots[dragging.sourceSlot] || [];
    const item = sourceItems.find((o) => o.platform === dragging.platform);
    if (item) {
      removeFromCalendar(dragging.sourceSlot, dragging.platform);
      addToCalendar(target, item);
    }
    setDragging(null);
    setOverSlot(null);
  };

  const totalScheduled = Object.values(calendarSlots).reduce(
    (sum, items) => sum + items.length,
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-xl text-warm">
            Editorial Calendar
          </h2>
          <p className="text-muted text-sm mt-0.5">
            {totalScheduled > 0
              ? `${totalScheduled} piece${totalScheduled !== 1 ? "s" : ""} scheduled`
              : "Drag content from generated outputs to schedule it"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(PLATFORM_COLORS).map(([p, cls]) => (
            <span
              key={p}
              className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[700px] border-collapse">
          <thead>
            <tr>
              <th className="w-16 bg-surface/80 border-b border-r border-border p-2" />
              {DAYS.map((day) => (
                <th
                  key={day}
                  className="bg-surface/80 border-b border-r border-border px-3 py-2.5 text-xs font-heading font-semibold text-muted uppercase tracking-wider text-center"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map((time) => (
              <tr key={time}>
                <td className="bg-surface/40 border-r border-b border-border px-2 py-2 text-xs text-muted text-right font-mono whitespace-nowrap">
                  {time}
                </td>
                {DAYS.map((day) => {
                  const key = slotKey(day, time);
                  const items = calendarSlots[key] || [];
                  const isOver = overSlot === key;

                  return (
                    <td
                      key={key}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setOverSlot(key);
                      }}
                      onDragLeave={() => setOverSlot(null)}
                      onDrop={() => handleDrop(day, time)}
                      className={`border-r border-b border-border p-1.5 min-h-[52px] align-top transition-colors ${
                        isOver ? "bg-primary/10" : "bg-surface-2/30 hover:bg-surface/50"
                      }`}
                    >
                      <div className="space-y-1">
                        {items.map((item) => (
                          <motion.div
                            key={item.platform}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            draggable
                            onDragStart={() => handleDragStart(item.platform, key)}
                            className={`flex items-center justify-between gap-1 px-1.5 py-1 rounded-md border text-xs cursor-grab active:cursor-grabbing ${
                              PLATFORM_COLORS[item.platform] ||
                              "bg-primary/10 border-primary text-primary"
                            }`}
                          >
                            <span className="truncate">
                              {PLATFORM_LABELS[item.platform] || item.platform}
                            </span>
                            <button
                              onClick={() => removeFromCalendar(key, item.platform)}
                              className="flex-shrink-0 opacity-60 hover:opacity-100"
                            >
                              <X size={10} />
                            </button>
                          </motion.div>
                        ))}
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
