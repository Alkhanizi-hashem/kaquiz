import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { Text, TextInput } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { AuthField } from "@/components/auth-field";
import { AuthLink } from "@/components/auth-link";
import { AuthScreen } from "@/components/auth-screen";
import { PASSWORD_POLICY, validateRegistration, type FieldErrors } from "@/lib/auth-validation";
import { errorText } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

export default function CreateAccountScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const { registerWithEmail } = useAuth();
  const submitting = useRef(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(typeof params.email === "string" ? params.email : "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (submitting.current) return;
    const result = validateRegistration({ name, email, password });
    setErrors(result.errors);
    setFormError(null);
    if (Object.keys(result.errors).length) return;

    submitting.current = true;
    setLoading(true);
    try {
      await registerWithEmail(result.values);
    } catch (error) {
      setFormError(errorText(error));
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <AuthScreen
      headerVisible
      eyebrow="YOUR CIRCLE"
      title={"Make room for\nyour people."}
      detail="Create your account, invite a friend, and find each other on the map."
      footer={<AuthLink href="/auth/login">Already have an account? Sign in</AuthLink>}
    >
      <AuthField
        label="Name"
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        maxLength={80}
        onChangeText={(value) => {
          setName(value);
          setErrors((current) => ({ ...current, name: undefined }));
        }}
        onSubmitEditing={() => emailRef.current?.focus()}
        placeholder="Your name"
        returnKeyType="next"
        textContentType="name"
        value={name}
      />
      <AuthField
        label="Email address"
        error={errors.email}
        inputRef={emailRef}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onChangeText={(value) => {
          setEmail(value);
          setErrors((current) => ({ ...current, email: undefined }));
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
        autoComplete="new-password"
        importantForAutofill="yes"
        onChangeText={(value) => {
          setPassword(value);
          setErrors((current) => ({ ...current, password: undefined }));
        }}
        onSubmitEditing={submit}
        passwordRules="minlength: 12; required: digit; required: alpha;"
        placeholder="Create a password"
        returnKeyType="done"
        secureTextEntry
        textContentType="newPassword"
        value={password}
      />
      <Text style={{ color: errors.password ? colors.coralDark : colors.muted, fontSize: 13, lineHeight: 19 }}>
        {PASSWORD_POLICY}
      </Text>
      {formError ? <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark }}>{formError}</Text> : null}
      <AtlasButton onPress={submit} loading={loading}>Create account</AtlasButton>
    </AuthScreen>
  );
}
