import { useEffect, useState } from 'react';

const MESSAGE_DURATION_MS = 4000;

export function useTransientMessage() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!message) return;
    const timeoutId = window.setTimeout(
      () => setMessage(null),
      MESSAGE_DURATION_MS,
    );
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  return { message, setMessage };
}
