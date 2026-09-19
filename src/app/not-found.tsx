/**
 * App Router 404 for A-ONE Restaurant.
 * Dependency-free, fast fallback.
 */
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "1.5rem",
        background: "linear-gradient(160deg, #0a0a0a, #171717 55%, #1c1917)",
        color: "white",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ width: "100%", maxWidth: "28rem", textAlign: "center" }}>
        <p style={{ fontSize: "3.75rem", fontWeight: 900, margin: 0, lineHeight: 1, color: "#f59e0b" }}>
          404
        </p>
        <h1 style={{ marginTop: "0.75rem", fontSize: "1.25rem", fontWeight: 700 }}>
          Page Not Found
        </h1>
        <p
          style={{
            marginTop: "0.5rem",
            fontSize: "0.875rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.75)",
          }}
        >
          The requested page could not be found. Please return to the A-ONE Restaurant management dashboard.
        </p>

        <div
          style={{
            marginTop: "2rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            justifyContent: "center",
          }}
        >
          <a
            href="/admin"
            style={{
              padding: "0.625rem 1.25rem",
              borderRadius: "0.5rem",
              background: "#f59e0b",
              color: "#0a0a0a",
              fontWeight: 700,
              fontSize: "0.875rem",
              textDecoration: "none",
            }}
          >
            Go to Operations
          </a>
          <a
            href="/login"
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
            Staff Sign In
          </a>
        </div>
      </div>
    </main>
  );
}
