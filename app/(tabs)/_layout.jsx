// ============================================
// FILE: app/(tabs)/_layout.jsx
// Tabs Layout - Main Navigation for User Side
// Tabs: Home, History, Active Guests, Settings
// ============================================

import ApartmentHeader from "@/components/user/ApartmentHeader";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

export default function TabsLayout() {
  return (
    <>
      {/* Common Header with Apartment Switcher */}
      <ApartmentHeader />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary.blue,
          tabBarInactiveTintColor: colors.text.tertiary,
          tabBarStyle: {
            backgroundColor: colors.background.primary,
            borderTopWidth: 1,
            borderTopColor: colors.border.light,
            height: Platform.OS === "ios" ? 85 : 65,
            paddingBottom: Platform.OS === "ios" ? 25 : 10,
            paddingTop: 10,
            elevation: 0, // No shadow on Android
            shadowOpacity: 0, // No shadow on iOS
          },
          tabBarLabelStyle: {
            fontFamily: typography.fonts.medium,
            fontSize: typography.sizes.xs,
            marginTop: spacing.xxs,
          },
          tabBarIconStyle: {
            marginTop: spacing.xxs,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.lg,
                  backgroundColor: focused
                    ? colors.primaryShades.blue50
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={focused ? "home" : "home-outline"}
                  size={size}
                  color={color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.lg,
                  backgroundColor: focused
                    ? colors.primaryShades.blue50
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={focused ? "time" : "time-outline"}
                  size={size}
                  color={color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="active"
          options={{
            title: "Active",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.lg,
                  backgroundColor: focused
                    ? colors.primaryShades.blue50
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={focused ? "people" : "people-outline"}
                  size={size}
                  color={color}
                />
              </View>
            ),
          }}
        />

        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size, focused }) => (
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: borderRadius.lg,
                  backgroundColor: focused
                    ? colors.primaryShades.blue50
                    : "transparent",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={focused ? "settings" : "settings-outline"}
                  size={size}
                  color={color}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}
