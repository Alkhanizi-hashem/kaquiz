import { useEffect, useEffectEvent, useState } from "react";
import { Animated, Easing, Modal, Pressable, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/theme";

type Props = {
  requestId: number;
  senderName: string;
  onDismiss: () => void;
  onPress: () => void;
};

export function FriendRequestToast({ requestId, senderName, onDismiss, onPress }: Props) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(12));
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const dismiss = useEffectEvent(onDismiss);
  const useNativeDriver = process.env.EXPO_OS !== "web";

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(reduceMotion ? 0 : 12);
    const easing = Easing.bezier(0.23, 1, 0.32, 1);
    const enter = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, easing, useNativeDriver }),
      Animated.timing(translateY, { toValue: 0, duration: 180, easing, useNativeDriver }),
    ]);
    enter.start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 180, easing, useNativeDriver }),
        Animated.timing(translateY, {
          toValue: reduceMotion ? 0 : 12,
          duration: 180,
          easing,
          useNativeDriver,
        }),
      ]).start(({ finished }) => {
        if (finished) dismiss();
      });
    }, 1_820);

    return () => {
      clearTimeout(timer);
      enter.stop();
      opacity.stopAnimation();
      translateY.stopAnimation();
    };
  }, [opacity, reduceMotion, requestId, translateY, useNativeDriver]);

  return (
    <Modal transparent visible animationType="none" onRequestClose={onDismiss}>
      <View style={{ flex: 1, pointerEvents: "box-none" }}>
        <Animated.View
          accessibilityRole="alert"
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: insets.bottom + 88,
            maxWidth: 520,
            alignSelf: "center",
            opacity,
            transform: [{ translateY }],
          }}
        >
          <Pressable
            accessibilityLabel={`New friend request from ${senderName}. Open requests.`}
            accessibilityRole="button"
            onPress={onPress}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 18,
              borderCurve: "continuous",
              borderWidth: 1,
              borderColor: colors.line,
              backgroundColor: colors.surface,
              boxShadow: "0 10px 30px rgba(16, 35, 30, 0.2)",
              opacity: pressed ? 0.78 : 1,
            })}
          >
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral }} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "900" }}>New friend request</Text>
              <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 14 }}>
                {senderName} wants to connect. Tap to respond.
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
