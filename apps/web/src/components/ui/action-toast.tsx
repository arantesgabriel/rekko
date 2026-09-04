"use client";

import { useEffect } from "react";

export function ActionToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onDismiss, 3200);
    return () => window.clearTimeout(timeout);
  }, [message, onDismiss]);

  return (
    <div aria-live="polite" className="action-toast" role="status">
      <span aria-hidden="true">✓</span>
      {message}
    </div>
  );
}
