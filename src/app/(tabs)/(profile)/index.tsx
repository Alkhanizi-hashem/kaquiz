import { Stack } from "expo-router/stack";
import { useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";

import { AtlasButton } from "@/components/atlas-button";
import { AtlasCard } from "@/components/atlas-card";
import { Avatar } from "@/components/avatar";
import { useContentStyle } from "@/hooks/use-content-style";
import { errorText } from "@/lib/format";
import { useAuth } from "@/providers/auth-provider";
import { colors } from "@/theme";
import { displayName } from "@/lib/user-display";

const inputStyle = {
  minHeight: 48,
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: 12,
  borderCurve: "continuous" as const,
  paddingHorizontal: 14,
  color: colors.ink,
  backgroundColor: colors.surface,
  fontSize: 16,
};

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const saveInFlight = useRef(false);
  const avatarRef = useRef<TextInput>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const contentStyle = useContentStyle();

  const save = async () => {
    if (!name.trim() || saveInFlight.current) return;
    saveInFlight.current = true;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateUser({ name: name.trim(), avatar: avatar.trim() || null });
      setSaved(true);
    } catch (saveError) {
      setError(errorText(saveError));
    } finally {
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ ...contentStyle, paddingTop: 12, paddingBottom: 32, gap: 24 }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      style={{ backgroundColor: colors.paper }}
    >
      <Stack.Screen options={{ title: "Profile" }} />
      <View style={{ alignItems: "center", gap: 10, paddingVertical: 8 }}>
        <Avatar name={name || null} email={user?.email} uri={avatar} size={88} />
        <Text selectable style={{ color: colors.ink, fontSize: 22, fontWeight: "900" }}>
          {user ? displayName(user) : "Kaquiz user"}
        </Text>
        <Text selectable style={{ color: colors.muted }}>{user?.email}</Text>
      </View>
      <AtlasCard>
        <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 20, fontWeight: "800" }}>Make it yours</Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>This is how you appear to your friends.</Text>
        <View style={{ gap: 6 }}>
          <Text nativeID="name-label" style={{ color: colors.ink, fontWeight: "800" }}>Display name</Text>
          <TextInput
            accessibilityLabel="Display name"
            accessibilityLabelledBy="name-label"
            editable={!saving}
            returnKeyType="next"
            onSubmitEditing={() => avatarRef.current?.focus()}
            autoCapitalize="words"
            maxLength={80}
            onChangeText={(value) => { setName(value); setSaved(false); setError(null); }}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={name}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text nativeID="avatar-label" style={{ color: colors.ink, fontWeight: "800" }}>Profile photo URL</Text>
          <TextInput
            ref={avatarRef}
            accessibilityLabel="Profile photo URL, optional"
            accessibilityLabelledBy="avatar-label"
            editable={!saving}
            returnKeyType="done"
            onSubmitEditing={save}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={(value) => { setAvatar(value); setSaved(false); setError(null); }}
            placeholder="https://example.com/photo.jpg"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={avatar}
          />
          <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>Optional. Paste a link to a photo, or leave blank to use your initials.</Text>
        </View>
        {error ? <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark }}>{error}</Text> : null}
        {saved ? <Text accessibilityLiveRegion="polite" style={{ color: colors.greenDark, fontWeight: "700" }}>Profile saved.</Text> : null}
        <AtlasButton onPress={save} loading={saving} disabled={!name.trim()}>Save profile</AtlasButton>
      </AtlasCard>
      <AtlasCard style={{ backgroundColor: colors.mint }}>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>Sharing that respects your day</Text>
        <Text style={{ color: colors.inkSoft, lineHeight: 22 }}>
          Your location updates only while Kaquiz is open and location access is allowed. Updates pause in the background or when you sign out. Friends may still see your last shared location.
        </Text>
      </AtlasCard>
      <AtlasButton variant="danger" disabled={saving} onPress={logout}>Sign out</AtlasButton>
    </ScrollView>
  );
}
