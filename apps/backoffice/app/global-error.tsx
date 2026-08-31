"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string; requestId?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled backoffice root error", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <section
            style={{
              maxWidth: 480,
              textAlign: "center",
              fontFamily: "sans-serif",
            }}
          >
            <h1>GetRentos Backoffice couldn&apos;t start</h1>
            <p>
              Please retry. If the problem continues, contact platform support.
            </p>
            {error.requestId || error.digest ? (
              <p>Reference: {error.requestId ?? error.digest}</p>
            ) : null}
            <button
              type="button"
              onClick={reset}
              style={{ padding: "12px 24px", cursor: "pointer" }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
