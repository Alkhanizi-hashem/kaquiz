import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { errorText } from "@/lib/format";
import { colors } from "@/theme";
import type { GoogleSignInProps } from "./google-sign-in";

type GoogleIdentity = {
  initialize: (options: { client_id: string; callback: (response: { credential?: string }) => void; auto_select: boolean; ux_mode: "popup" }) => void;
  renderButton: (container: HTMLElement, options: { theme: "outline"; size: "large"; text: "continue_with" }) => void;
};
const identity = () => (window as Window & { google?: { accounts?: { id?: GoogleIdentity } } }).google?.accounts?.id;
let scriptPromise: Promise<GoogleIdentity> | null = null;
let receiveCredential: ((token: string) => void) | null = null;
let initializedClientId: string | null = null;

function loadGoogleIdentity() {
  if (identity()) return Promise.resolve(identity()!);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => identity() ? resolve(identity()!) : reject(new Error("Google sign-in could not load."));
    script.onerror = () => { script.remove(); scriptPromise = null; reject(new Error("Google sign-in could not load. Check your connection and reload.")); };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function GoogleSignIn({ disabled, onCredential }: GoogleSignInProps) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const pending = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  useEffect(() => { callback.current = onCredential; disabledRef.current = disabled; }, [onCredential, disabled]);

  useEffect(() => {
    if (!clientId) return;
    let active = true;
    const receive = async (token: string) => {
      if (!active || pending.current || disabledRef.current) return;
      pending.current = true;
      setLoading(true);
      setError(null);
      try { await callback.current(token); }
      catch (signInError) { if (active) setError(errorText(signInError)); }
      finally { pending.current = false; if (active) setLoading(false); }
    };
    loadGoogleIdentity().then((google) => {
      if (!active || !container.current) return;
      receiveCredential = receive;
      if (initializedClientId !== clientId) {
        google.initialize({ client_id: clientId, auto_select: false, ux_mode: "popup", callback: (response) => {
          if (response.credential) receiveCredential?.(response.credential);
        } });
        initializedClientId = clientId;
      }
      google.renderButton(container.current, { theme: "outline", size: "large", text: "continue_with" });
    }).catch((loadError) => { if (active) setError(errorText(loadError)); });
    return () => { active = false; if (receiveCredential === receive) receiveCredential = null; };
  }, [clientId]);

  if (!clientId) return null;
  return <View style={{ gap: 8 }}>
    <div ref={container} inert={Boolean(disabled || loading)} style={{ opacity: disabled || loading ? 0.5 : 1, minHeight: 44 }} />
    {loading ? <ActivityIndicator accessibilityLabel="Signing in with Google" /> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: colors.coralDark }}>{error}</Text> : null}
  </View>;
}
