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
  const { onPlatformOutput, onMeta, onError, onDone } = options;

  const close = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("contentos_token")
        : null;

    // EventSource doesn't support custom headers, so we pass token as query param
    const url = token
      ? `${SSE_URL(jobId)}?token=${token}`
      : SSE_URL(jobId);

    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      const raw = event.data as string;

      if (raw === "[DONE]") {
        onDone?.();
        close();
        return;
      }

      try {
        const data: SSEEvent = JSON.parse(raw);

        if (data.error) {
          onError?.(data.error);
          close();
          return;
        }

        if (data.type === "meta") {
          onMeta?.(data);
          return;
        }

        if (data.platform) {
          onPlatformOutput?.(data);
        }
      } catch {
        // ignore malformed frames
      }
    };

    es.onerror = () => {
      onError?.("Connection lost");
      close();
    };

    return () => close();
  }, [jobId, onPlatformOutput, onMeta, onError, onDone, close]);

  return { close };
}
