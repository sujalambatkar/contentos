"use client";

import { useEffect, useRef, useCallback } from "react";
import { SSE_URL } from "./api";

interface SSEEvent {
  platform?: string;
  content?: Record<string, unknown>;
  schedule?: Record<string, unknown>;
  status?: string;
  error?: string;
  type?: string;
  topics?: string[];
  hooks?: string[];
  tone_profile?: Record<string, unknown>;
}

interface UseSSEOptions {
  onPlatformOutput?: (event: SSEEvent) => void;
  onMeta?: (event: SSEEvent) => void;
  onError?: (error: string) => void;
  onDone?: () => void;
}

export function useSSE(jobId: string | null, options: UseSSEOptions) {
  const esRef = useRef<EventSource | null>(null);

  // Keep a ref to the latest callbacks so the EventSource handler always
  // calls the current version without needing to be recreated on every render.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  useEffect(() => {
    if (!jobId) return;

    // Avoid opening a second connection if one is already open for this job
    if (esRef.current) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("contentos_token")
        : null;

    const url = token ? `${SSE_URL(jobId)}?token=${token}` : SSE_URL(jobId);

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      const raw = event.data as string;

      if (raw === "[DONE]") {
        optionsRef.current.onDone?.();
        close();
        return;
      }

      try {
        const data: SSEEvent = JSON.parse(raw);

        if (data.error) {
          optionsRef.current.onError?.(data.error);
          close();
          return;
        }

        if (data.type === "meta") {
          optionsRef.current.onMeta?.(data);
          return;
        }

        if (data.platform) {
          optionsRef.current.onPlatformOutput?.(data);
        }
      } catch {
        // ignore malformed frames
      }
    };

    es.onerror = () => {
      optionsRef.current.onError?.("Connection lost");
      close();
    };

    return () => close();
    // Only recreate the EventSource when the jobId itself changes,
    // never when callbacks change — that's what optionsRef is for.
  }, [jobId, close]);

  return { close };
}
