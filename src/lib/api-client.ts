type Fetch = typeof globalThis.fetch;

type ClientOptions = {
  baseUrl: string;
  getToken: () => Promise<string | null>;
  fetchImpl?: Fetch;
};

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  authenticated?: boolean;
};

type UnauthorizedHandler = (rejectedToken: string | null) => void | Promise<void>;

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

function errorMessage(payload: unknown, status: number) {
  if (payload && typeof payload === "object") {
    const value = payload as Record<string, unknown>;
    const envelope = value.error && typeof value.error === "object"
      ? value.error as Record<string, unknown>
      : value;
    const message = envelope.message ?? value.message ?? value.error ?? value.detail;
    if (typeof message === "string" && message.trim()) return message;
  }

  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 404) return "The requested item could not be found.";
  return "The server could not complete this request. Please try again.";
}

export function createApiClient({ baseUrl, getToken, fetchImpl = fetch }: ClientOptions) {
  const root = baseUrl.replace(/\/$/, "");
  let unauthorizedHandler: UnauthorizedHandler | null = null;

  return {
    setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
      unauthorizedHandler = handler;
    },
    async request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
      const { body, authenticated = true, headers: suppliedHeaders, ...init } = options;
      const token = authenticated ? await getToken() : null;
      const headers: Record<string, string> = {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(suppliedHeaders as Record<string, string> | undefined),
      };

      let response: Response;
      try {
        response = await fetchImpl(`${root}/${path.replace(/^\//, "")}`, {
          ...init,
          headers,
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch {
        throw new ApiError(
          "Unable to reach the server. Check your connection and try again.",
          0,
          "NETWORK_ERROR",
        );
      }

      const contentType = response.headers.get("content-type") ?? "";
      const payload = response.status === 204
        ? undefined
        : contentType.includes("application/json")
          ? await response.json().catch(() => undefined)
          : await response.text().catch(() => undefined);

      if (!response.ok) {
        if (response.status === 401 && authenticated && unauthorizedHandler) {
          await Promise.resolve(unauthorizedHandler(token)).catch(() => undefined);
        }
        const value = payload && typeof payload === "object"
          ? payload as Record<string, unknown>
          : undefined;
        const envelope = value?.error && typeof value.error === "object"
          ? value.error as Record<string, unknown>
          : value;
        const code = envelope?.code;
        throw new ApiError(
          typeof payload === "string" && payload.trim()
            ? payload
            : errorMessage(payload, response.status),
          response.status,
          typeof code === "string" ? code : undefined,
        );
      }

      return payload as T;
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
