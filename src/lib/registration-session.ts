import type { User } from "@/types/api";

export type AppSession = {
  access_token: string;
  user?: User;
};

type RegistrationValues = {
  name: string;
  email: string;
  password: string;
};

export function parseAppSession(value: unknown): AppSession {
  if (!value || typeof value !== "object") {
    throw new Error("Kaquiz did not return a valid session token.");
  }

  const session = value as Record<string, unknown>;
  if (typeof session.access_token !== "string" || !session.access_token.trim()) {
    throw new Error("Kaquiz did not return a valid session token.");
  }

  return {
    access_token: session.access_token.trim(),
    ...(session.user && typeof session.user === "object" ? { user: session.user as User } : {}),
  };
}

export async function registerAndStartSession(
  actions: {
    register: (values: RegistrationValues) => Promise<unknown>;
    startSession: (session: AppSession) => Promise<void>;
  },
  values: RegistrationValues,
) {
  const session = parseAppSession(await actions.register(values));
  await actions.startSession(session);
}

/** Google credentials are exchanged for a Kaquiz session, never stored as app tokens. */
export async function googleAndStartSession(
  actions: {
    exchange: (body: { id_token: string }) => Promise<unknown>;
    startSession: (session: AppSession) => Promise<void>;
  },
  idToken: string,
) {
  if (!idToken.trim()) throw new Error("Google did not return an ID token.");
  const session = parseAppSession(await actions.exchange({ id_token: idToken }));
  await actions.startSession(session);
}
