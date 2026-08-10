import { Stack } from "expo-router/stack";
import { useState } from "react";
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
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const contentStyle = useContentStyle();

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await updateUser({ name: name.trim(), avatar: avatar.trim() || null });
      setSaved(true);
    } catch (saveError) {
      setError(errorText(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      automaticallyAdjustKeyboardInsets
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ ...contentStyle, paddingVertical: 16, gap: 20 }}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: colors.paper }}
    >
      <Stack.Screen options={{ title: "Profile" }} />
      <View style={{ alignItems: "center", gap: 10 }}>
        <Avatar name={name || null} email={user?.email} uri={avatar} size={88} />
        <Text selectable style={{ color: colors.ink, fontSize: 22, fontWeight: "900" }}>
          {user ? displayName(user) : "Kaquiz user"}
        </Text>
        <Text selectable style={{ color: colors.muted }}>{user?.email}</Text>
      </View>
      <AtlasCard>
        <View style={{ gap: 6 }}>
          <Text nativeID="name-label" style={{ color: colors.ink, fontWeight: "800" }}>Display name</Text>
          <TextInput
            accessibilityLabelledBy="name-label"
            autoCapitalize="words"
            maxLength={80}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={name}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text nativeID="avatar-label" style={{ color: colors.ink, fontWeight: "800" }}>Avatar URL</Text>
          <TextInput
            accessibilityLabelledBy="avatar-label"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            onChangeText={setAvatar}
            placeholder="https://example.com/photo.jpg"
            placeholderTextColor={colors.muted}
            style={inputStyle}
            value={avatar}
          />
        </View>
        {error ? <Text accessibilityRole="alert" selectable style={{ color: colors.coralDark }}>{error}</Text> : null}
        {saved ? <Text accessibilityLiveRegion="polite" style={{ color: colors.greenDark, fontWeight: "700" }}>Profile saved.</Text> : null}
        <AtlasButton onPress={save} loading={saving} disabled={!name.trim()}>Save profile</AtlasButton>
      </AtlasCard>
      <AtlasCard style={{ backgroundColor: colors.mint }}>
        <Text style={{ color: colors.ink, fontSize: 17, fontWeight: "800" }}>Foreground sharing only</Text>
        <Text style={{ color: colors.inkSoft, lineHeight: 22 }}>
          Kaquiz stops its location subscription whenever the app enters the background or you sign out.
        </Text>
      </AtlasCard>
      <AtlasButton variant="danger" onPress={logout}>Logout</AtlasButton>
    </ScrollView>
  );
}
