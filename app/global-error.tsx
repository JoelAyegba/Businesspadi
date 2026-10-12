"use client";

import { useEffect } from "react";

/**
 * Root error boundary.
 *
 * This is the ONLY boundary that can catch errors thrown in the root
 * `app/layout.tsx` and its provider tree (ClerkProvider, ThemeProvider).
 * When such an error is uncaught there is no boundary above it, so React
 * unmounts the whole tree and the page renders completely blank. This
 * component replaces that blank with a visible fallback — and in dev it
 * prints the actual error message so failures (e.g. hydration mismatches)
 * are diagnosable without opening DevTools.
 *
 * A global-error boundary must render its own <html> and <body>, because
 * it replaces the root layout entirely when it activates.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
          background: "#f1f5f9",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#0f172a",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "32rem",
            borderRadius: "0.75rem",
            border: "1px solid #e2e8f0",
            background: "#ffffff",
            boxShadow: "0 10px 30px rgba(15,23,42,0.08)",
            padding: "2rem",
          }}
        >
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: "0 0 0.75rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#475569", margin: "0 0 1.25rem" }}>
            An unexpected error occurred while loading the application. Try again — if
            it keeps happening, reload the page.
          </p>

          {isDevelopment && (
            <pre
              style={{
                fontSize: "0.75rem",
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color: "#b91c1c",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                margin: "0 0 1.25rem",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                maxHeight: "16rem",
                overflow: "auto",
              }}
            >
              {error.message}
              {error.digest ? `\n\nDigest: ${error.digest}` : ""}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          )}

          <button
            type="button"
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              height: "2.5rem",
              padding: "0 1.25rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#2563eb",
              color: "#ffffff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
