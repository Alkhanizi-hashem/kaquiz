import Constants, { ExecutionEnvironment } from "expo-constants";
import { useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { errorText } from "@/lib/format";
import { colors } from "@/theme";

export type GoogleSignInProps = {
  disabled?: boolean;
  onCredential: (idToken: string) => Promise<void>;
};

export function GoogleSignIn({ disabled, onCredential }: GoogleSignInProps) {
  const pending = useRef(false);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  if (!webClientId || (Platform.OS === "ios" && !iosClientId)) return null;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return <Text style={{ color: colors.muted }}>Google sign-in requires a development build, not Expo Go. Email sign-in is still available.</Text>;
  }

  const signIn = async () => {
    if (pending.current || disabled) return;
    pending.current = true;
    setLoading(true);
    setError(null);
    try {
      // Delay loading the native module so email login still works in Expo Go.
      const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = await import("@react-native-google-signin/google-signin");
      GoogleSignin.configure({ webClientId, iosClientId, offlineAccess: false });
      try {
        if (Platform.OS === "android") await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const result = await GoogleSignin.signIn();
        if (!isSuccessResponse(result)) return; // User canceled: not an authentication failure.
        if (!result.data.idToken) throw new Error("Google did not return an ID token. Check the web client ID configuration.");
        if (active.current) await onCredential(result.data.idToken);
      } catch (signInError) {
        if (isErrorWithCode(signInError) && signInError.code === statusCodes.SIGN_IN_CANCELLED) return;
        throw signInError;
      }
    } catch (signInError) {
      if (active.current) setError(errorText(signInError));
    } finally {
      pending.current = false;
      if (active.current) setLoading(false);
    }
  };

  return <View style={{ gap: 14 }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><View style={{ flex: 1, height: 1, backgroundColor: colors.line }} /><Text style={{ color: colors.muted, fontSize: 12 }}>or</Text><View style={{ flex: 1, height: 1, backgroundColor: colors.line }} /></View>
    <AtlasButton variant="secondary" disabled={disabled} loading={loading} onPress={signIn}>Continue with Google</AtlasButton>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.coralDark }}>{error}</Text> : null}
  </View>;
}
