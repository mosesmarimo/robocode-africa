"use client";

import * as React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          background: "#0d1426",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center", padding: "1rem", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginBottom: "1.25rem" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: "0.5rem",
              border: "none",
              padding: "0.6rem 1.1rem",
              fontWeight: 600,
              color: "#fff",
              background: "linear-gradient(110deg, #2563ff, #16c79a)",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
