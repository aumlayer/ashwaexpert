"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getAuthToken } from "@/hooks/use-auth";

type GatewayEvent = {
  type?: string;
  service?: string;
  method?: string;
  path?: string;
  status_code?: number;
  ts?: string;
  data?: unknown;
};

function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
}

export function RealtimeListener() {
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const url = `${getApiBaseUrl()}/events/stream`;

    const run = async () => {
      try {
        const res = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: ctrl.signal,
        });

        if (!res.ok || !res.body) return;

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Split on blank line (SSE frame delimiter)
          const frames = buffer.split("\n\n");
          buffer = frames.pop() || "";

          for (const frame of frames) {
            const lines = frame.split("\n");
            const dataLines = lines.filter((l) => l.startsWith("data:"));
            if (dataLines.length === 0) continue;

            const dataText = dataLines
              .map((l) => l.replace(/^data:\s?/, ""))
              .join("\n")
              .trim();

            if (!dataText || dataText === "{}") continue;

            let evt: GatewayEvent | null = null;
            try {
              evt = JSON.parse(dataText);
            } catch {
              evt = null;
            }

            if (!evt) continue;

            // Invalidate queries based on event type.
            if (evt.service === "tickets" || (evt.type || "").startsWith("tickets.")) {
              queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
              queryClient.invalidateQueries({ queryKey: ["tickets"] });
            }

            if (evt.service === "assignments" || (evt.type || "").startsWith("assignments.")) {
              queryClient.invalidateQueries({ queryKey: ["tech", "assignments"] });
              queryClient.invalidateQueries({ queryKey: ["admin", "tickets"] });
            }

            // Dashboard cards & portal pages that show derived counts
            queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
            queryClient.invalidateQueries({ queryKey: ["subscription"] });
            queryClient.invalidateQueries({ queryKey: ["payments"] });
          }
        }
      } catch {
        // best-effort; silently stop
      }
    };

    void run();

    return () => {
      ctrl.abort();
      abortRef.current = null;
    };
  }, [queryClient]);

  return null;
}
