"use client";

import "@wokwi/elements";
import * as React from "react";
import { registerPartEl, unregisterPartEl } from "@/lib/studio/pin-registry";

type Props = {
  partId: string;
  tag: string;
  props?: Record<string, unknown>;
};

/** Renders a @wokwi/elements custom element and registers it for pin lookups. */
export function WokwiPart({ partId, tag, props }: Props) {
  const ref = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    registerPartEl(partId, el);
    return () => unregisterPartEl(partId);
  }, [partId]);

  React.useEffect(() => {
    const el = ref.current as (HTMLElement & Record<string, unknown>) | null;
    if (!el) return;
    for (const [k, v] of Object.entries(props ?? {})) {
      try {
        el[k] = v;
      } catch {
        try {
          el.setAttribute(k, String(v));
        } catch {
          /* ignore */
        }
      }
    }
  }, [props]);

  return React.createElement(tag, { ref: ref as React.Ref<HTMLElement> });
}
