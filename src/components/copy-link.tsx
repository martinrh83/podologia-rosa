"use client";

import { useState } from "react";

type Props = {
  /** Absolute URL, or a path resolved against the current origin when copied. */
  href: string;
  /** Shown instead of the raw URL when the URL itself would be noise. */
  label?: string;
};

/**
 * A link with a copy button.
 *
 * With no email to carry it, the cancel link is handed over on screen — so it
 * has to be easy to take away. Selecting a 60-character URL by hand on a phone
 * is not that.
 *
 * The absolute URL is resolved on click rather than during render: `window` does
 * not exist while the server renders this, and the relative form is what we want
 * displayed anyway.
 */
export function CopyLink({ href, label }: Props) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const absolute = new URL(href, window.location.origin).toString();

    try {
      await navigator.clipboard.writeText(absolute);
      setState("copied");
    } catch {
      // Clipboard access can be refused (insecure context, permissions).
      // Say so rather than pretending it worked.
      setState("failed");
    }

    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={href} className="min-w-0 break-all text-[0.9rem] text-accent underline">
        {label ?? href}
      </a>

      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:border-accent"
      >
        {state === "copied" ? "¡Copiado!" : state === "failed" ? "Copialo a mano" : "Copiar"}
      </button>

      {/* Announced to screen readers without needing focus to move. */}
      <span aria-live="polite" className="sr-only">
        {state === "copied" ? "Enlace copiado" : ""}
      </span>
    </div>
  );
}
