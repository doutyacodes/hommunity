// ============================================
// FILE: components/common/ComingSoon.jsx
// Theme-matched "Coming Soon" screen
// ============================================

import { borderRadius, colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function ComingSoon({ title = "Coming Soon", message, showBack = true }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background.primary,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
      }}
    >
      {/* Illustration or Icon */}
      <View
        style={{
          width: 120,
          height: 120,
          borderRadius: borderRadius.full,
          backgroundColor: colors.primaryShades.blue50,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: spacing.lg,
        }}
      >
        <Ionicons name="construct-outline" size={64} color={colors.primary.blue} />
      </View>

      {/* Title */}
      <Text
        style={{
          fontFamily: typography.fonts.bold,
          fontSize: typography.sizes.xl,
          color: colors.text.primary,
          marginBottom: spacing.sm,
        }}
      >
        {title}
      </Text>

      {/* Optional description */}
      <Text
        style={{
          fontFamily: typography.fonts.regular,
          fontSize: typography.sizes.sm,
          color: colors.text.secondary,
          textAlign: "center",
          marginBottom: spacing.xl,
          lineHeight: 22,
        }}
      >
        {message ||
          "We’re working hard to bring this feature to you soon. Stay tuned for updates!"}
      </Text>

      {/* Optional Back button */}
      {showBack && (
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.primary.blue,
            borderRadius: borderRadius.lg,
            paddingVertical: spacing.sm,
            paddingHorizontal: spacing.lg,
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 6 }} />
          <Text
            style={{
              fontFamily: typography.fonts.medium,
              fontSize: typography.sizes.sm,
              color: "#fff",
            }}
          >
            Go Back
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
