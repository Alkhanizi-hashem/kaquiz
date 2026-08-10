import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { AtlasCard } from "@/components/atlas-card";
import { Avatar } from "@/components/avatar";
import { ScreenState } from "@/components/screen-state";
import { useContentStyle } from "@/hooks/use-content-style";
import { useInviteActions, useSearchUsers } from "@/hooks/use-api";
import { emailError } from "@/lib/auth-validation";
import { errorText } from "@/lib/format";
import { displayName } from "@/lib/user-display";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";

export default function SearchScreen() {
  const [email, setEmail] = useState("");
  const { user, status } = useAuth();
  const results = useSearchUsers(email);
  const { send, accept } = useInviteActions(user?.id);
  const contentStyle = useContentStyle();
  const validEmail = Boolean(email.trim()) && !emailError(email);

  if (status !== "authenticated") {
    return <ScreenState title="Sign in required" detail="Your session is no longer active." />;
  }

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ ...contentStyle, paddingVertical: 16, gap: 16 }}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.paper }}
    >
      <View style={{ gap: 6 }}>
        <Text nativeID="email-label" style={{ color: colors.ink, fontWeight: "800" }}>Email address</Text>
        <TextInput
          accessibilityLabelledBy="email-label"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={(value) => {
            setEmail(value);
            send.reset();
          }}
          placeholder="friend@example.com"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={{
            minHeight: 52,
            borderWidth: 2,
            borderColor: validEmail ? colors.green : colors.line,
            borderRadius: 14,
            borderCurve: "continuous",
            paddingHorizontal: 16,
            backgroundColor: colors.surface,
            color: colors.ink,
            fontSize: 17,
          }}
          value={email}
        />
        <Text style={{ color: colors.muted, fontSize: 13 }}>Search uses an exact email address.</Text>
      </View>
      {!email.trim() ? (
        <ScreenState title="Find someone you know" detail="Enter their full email address to protect everyone's privacy." />
      ) : !validEmail ? (
        <Text accessibilityRole="alert" style={{ color: colors.coralDark }}>Enter a valid email address.</Text>
      ) : results.isLoading ? (
        <ScreenState loading title="Searching" />
      ) : results.isError ? (
        <ScreenState title="Search did not complete" detail={errorText(results.error)} />
      ) : !results.data?.length ? (
        <ScreenState title="No account found" detail="Check the email and try again." />
      ) : (
        results.data
          .filter((result) => result.id !== user?.id)
          .map((result) => {
            const name = displayName(result);
            const isSending = send.isPending && send.variables === result.id;
            const isAccepting = accept.isPending && accept.variables === result.id;
            const disabled = result.relationship === "friends" || result.relationship === "outgoing_pending";
            const label = result.relationship === "friends"
              ? "Already friends"
              : result.relationship === "outgoing_pending"
                ? "Request pending"
                : result.relationship === "incoming_pending"
                  ? "Accept request"
                  : send.isSuccess && send.variables === result.id
                    ? "Invite sent"
                    : "Send friend request";
            return (
              <AtlasCard key={result.id}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <Avatar name={result.name} email={result.email} uri={result.avatar} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: colors.ink, fontSize: 18, fontWeight: "800" }}>{name}</Text>
                    <Text selectable style={{ color: colors.muted }}>{result.email}</Text>
                  </View>
                </View>
                <AtlasButton
                  onPress={() => result.relationship === "incoming_pending"
                    ? accept.mutate(result.id)
                    : send.mutate(result.id)}
                  loading={isSending || isAccepting}
                  disabled={disabled || (send.isSuccess && send.variables === result.id)}
                >
                  {label}
                </AtlasButton>
              </AtlasCard>
            );
          })
      )}
      {send.isError || accept.isError ? (
        <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark, lineHeight: 22 }}>
          {errorText(send.error ?? accept.error)}
        </Text>
      ) : null}
    </ScrollView>
  );
}
