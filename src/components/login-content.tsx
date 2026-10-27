import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { GoogleSignIn } from "@/components/google-sign-in";
import { AuthField } from "@/components/auth-field";
import { AuthLink } from "@/components/auth-link";
import { AuthScreen } from "@/components/auth-screen";
import { validateLogin, type FieldErrors } from "@/lib/auth-validation";
import { errorText } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

export function LoginContent() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { loginWithEmail, loginWithGoogle } = useAuth();
  const signingIn = useRef(false);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (signingIn.current) return;
    const result = validateLogin({ email, password });
    setErrors(result.errors);
    setFormError(null);
    if (Object.keys(result.errors).length) return;

    signingIn.current = true;
    setLoading(true);
    try {
      await loginWithEmail(result.values.email, result.values.password);
    } catch (signInError) {
      setFormError(errorText(signInError));
    } finally {
      signingIn.current = false;
      setLoading(false);
    }
  };

  const signInWithGoogle = async (idToken: string) => {
    if (signingIn.current) return;
    signingIn.current = true;
    setLoading(true);
    setFormError(null);
    try { await loginWithGoogle(idToken); }
    finally { signingIn.current = false; setLoading(false); }
  };

  return (
    <AuthScreen
      eyebrow="A LITTLE CLOSER"
      title="Welcome back."
      detail="Pick up where you left off. See your friends’ shared locations, all in one place."
      footer={<Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center" }}>Share your latest location with accepted friends. Location updates pause when the app is in the background.</Text>}
    >
      <AuthField
        label="Email address"
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined }));
          setFormError(null);
        }}
        onSubmitEditing={() => passwordRef.current?.focus()}
        placeholder="you@example.com"
        returnKeyType="next"
        textContentType="emailAddress"
        value={email}
      />
      <AuthField
        label="Password"
        error={errors.password}
        inputRef={passwordRef}
        autoCapitalize="none"
        autoComplete="current-password"
        importantForAutofill="yes"
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
          setFormError(null);
        }}
        onSubmitEditing={signIn}
        placeholder="Your password"
        returnKeyType="done"
        secureTextEntry
        textContentType="password"
        value={password}
      />
      {formError ? <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark }}>{formError}</Text> : null}
      <AtlasButton onPress={signIn} loading={loading}>Sign in</AtlasButton>
      <GoogleSignIn disabled={loading} onCredential={signInWithGoogle} />
      <AuthLink href={{ pathname: "/auth/create-account", params: { email } }}>New to Kaquiz? Create an account</AuthLink>
    </AuthScreen>
  );
}
