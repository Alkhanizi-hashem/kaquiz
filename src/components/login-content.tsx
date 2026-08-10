import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { AuthField } from "@/components/auth-field";
import { AuthLink } from "@/components/auth-link";
import { AuthScreen } from "@/components/auth-screen";
import { validateLogin, type FieldErrors } from "@/lib/auth-validation";
import { errorText } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

export function LoginContent() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { loginWithEmail } = useAuth();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    const result = validateLogin({ email, password });
    setErrors(result.errors);
    setFormError(null);
    if (Object.keys(result.errors).length) return;

    setLoading(true);
    try {
      await loginWithEmail(result.values.email, result.values.password);
    } catch (signInError) {
      setFormError(errorText(signInError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      eyebrow="LIVE ATLAS"
      title="Welcome back."
      detail="Sign in with your email to see the people who chose to share their location with you."
      footer={<Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: "center" }}>Your password is sent securely to Kaquiz and is never stored on this device.</Text>}
    >
      <View
        accessibilityElementsHidden
        style={{
          width: 72,
          height: 72,
          borderRadius: 20,
          borderCurve: "continuous",
          backgroundColor: colors.ink,
          padding: 12,
          justifyContent: "space-between",
        }}
      >
        {[0, 1, 2].map((row) => (
          <View key={row} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {[0, 1, 2].map((column) => (
              <View
                key={column}
                style={{
                  width: row === 1 && column === 1 ? 15 : 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: row === 1 && column === 1 ? colors.coral : colors.green,
                }}
              />
            ))}
          </View>
        ))}
      </View>
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
      <AuthLink href={{ pathname: "/auth/create-account", params: { email } }}>New to Kaquiz? Create an account</AuthLink>
    </AuthScreen>
  );
}
