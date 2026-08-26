"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body>
        <main className="error-shell">
          <div className="segment-mark segment-mark--brand" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h1>Algo não saiu como esperado.</h1>
          <p>
            Seus dados continuam seguros. Tente carregar esta área novamente.
          </p>
          <button
            className="button button--primary"
            onClick={reset}
            type="button"
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
