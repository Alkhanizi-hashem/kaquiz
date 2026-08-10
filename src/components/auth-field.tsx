import type { RefObject } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";

import { colors } from "@/theme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  inputRef?: RefObject<TextInput | null>;
};

export function AuthField({ label, error, inputRef, ...props }: Props) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const errorId = `${id}-error`;

  return (
    <View style={{ gap: 7 }}>
      <Text nativeID={`${id}-label`} style={{ color: colors.ink, fontSize: 15, fontWeight: "800" }}>
        {label}
      </Text>
      <TextInput
        ref={inputRef}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${id}-label`}
        accessibilityHint={error}
        autoCorrect={false}
        placeholderTextColor={colors.muted}
        selectionColor={colors.greenDark}
        style={{
          minHeight: 52,
          borderWidth: error ? 2 : 1,
          borderColor: error ? colors.coralDark : colors.line,
          borderRadius: 14,
          borderCurve: "continuous",
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          color: colors.ink,
          fontSize: 17,
        }}
        {...props}
      />
      {error ? (
        <Text nativeID={errorId} accessibilityRole="alert" selectable style={{ color: colors.coralDark, fontSize: 13, lineHeight: 18 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
