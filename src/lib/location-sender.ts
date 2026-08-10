type LocationSenderOptions<T> = {
  send: (value: T) => Promise<void>;
  now?: () => number;
  intervalMs?: number;
  onSuccess?: (sentAt: number) => void;
  onError?: (error: unknown) => void;
};

export function createLocationSender<T>({
  send,
  now = Date.now,
  intervalMs = 5_000,
  onSuccess,
  onError,
}: LocationSenderOptions<T>) {
  let latest: T | undefined;
  let latestVersion = 0;
  let lastStartedAt: number | null = null;
  let inFlight = false;
  let active = true;

  async function flush(): Promise<void> {
    const startedAt = now();
    if (
      !active ||
      latest === undefined ||
      inFlight ||
      (lastStartedAt !== null && startedAt - lastStartedAt < intervalMs)
    ) return;

    const value = latest;
    const version = latestVersion;
    inFlight = true;
    lastStartedAt = startedAt;
    try {
      await send(value);
      onSuccess?.(startedAt);
    } catch (error) {
      onError?.(error);
    } finally {
      inFlight = false;
    }

    if (active && latestVersion !== version && now() - startedAt >= intervalMs) {
      await flush();
    }
  }

  return {
    flush,
    stop() {
      active = false;
    },
    update(value: T) {
      latest = value;
      latestVersion += 1;
      return flush();
    },
  };
}
