"use client";

/**
 * Root error boundary for A-ONE Restaurant portal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "linear-gradient(160deg, #0a0a0a, #1c1917)",
          color: "white",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <div style={{ maxWidth: "28rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#f59e0b" }}>
            A-ONE Operations Error
          </h1>
          <p
            style={{
              marginTop: "0.75rem",
              fontSize: "0.875rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            An unexpected error occurred. Please try refreshing or return to the management portal.
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: "1rem",
                fontFamily: "ui-monospace, monospace",
                fontSize: "0.6875rem",
                color: "rgba(255,255,255,0.45)",
              }}
            >
              Digest: {error.digest}
            </p>
          )}

          <div
            style={{
              marginTop: "2rem",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "#f59e0b",
                color: "#0a0a0a",
                fontWeight: 700,
                fontSize: "0.875rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <a
              href="/admin"
              style={{
                padding: "0.625rem 1.25rem",
                borderRadius: "0.5rem",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontWeight: 500,
                fontSize: "0.875rem",
                textDecoration: "none",
              }}
            >
              Back to Operations
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
