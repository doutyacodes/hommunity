// ============================================
// FILE: app/(tabs)/_layout.jsx
// Tabs Layout - Main Navigation for User Side
// Tabs: Home, My Home, Communities, Classifieds, Settings
// ============================================

import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import ApartmentHeader from "@/components/user/ApartmentHeader";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, View } from "react-native";

export default function TabsLayout() {
  return (
    <>
     <SafeAreaWrapper edges={['left', 'right', 'bottom']}>
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
            elevation: 0,
            shadowOpacity: 0,
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
        {/* 🏠 Home */}
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

        {/* 🏡 My Home */}
        <Tabs.Screen
          name="my-home"
          options={{
            title: "My Home",
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
                  name={focused ? "home-sharp" : "home-outline"}
                  size={size}
                  color={color}
                />
              </View>
            ),
          }}
        />

        {/* 👥 Communities */}
        <Tabs.Screen
          name="communities"
          options={{
            title: "Communities",
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

        {/* 🛒 Classifieds */}
        <Tabs.Screen
          name="classifieds"
          options={{
            title: "Classifieds",
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
                  name={focused ? "pricetags" : "pricetags-outline"}
                  size={size}
                  color={color}
                />
              </View>
            ),
          }}
        />

        {/* ⚙️ Settings */}
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

        <Tabs.Screen
          name="history"
          options={{
            // title: "History",
            // tabBarIcon: ({ color, size, focused }) => (
            //   <View
            //     style={{
            //       width: 40,
            //       height: 40,
            //       borderRadius: borderRadius.lg,
            //       backgroundColor: focused
            //         ? colors.primaryShades.blue50
            //         : "transparent",
            //       justifyContent: "center",
            //       alignItems: "center",
            //     }}
            //   >
            //     <Ionicons
            //       name={focused ? "time" : "time-outline"}
            //       size={size}
            //       color={color}
            //     />
            //   </View>
            // ),
            href: null,
          }}
        />

        <Tabs.Screen
          name="active"
          options={{
            // title: "Active",
            // tabBarIcon: ({ color, size, focused }) => (
            //   <View
            //     style={{
            //       width: 40,
            //       height: 40,
            //       borderRadius: borderRadius.lg,
            //       backgroundColor: focused
            //         ? colors.primaryShades.blue50
            //         : "transparent",
            //       justifyContent: "center",
            //       alignItems: "center",
            //     }}
            //   >
            //     <Ionicons
            //       name={focused ? "people" : "people-outline"}
            //       size={size}
            //       color={color}
            //     />
            //   </View>
            // ),
            href: null,
          }}
        />
      </Tabs>
     </SafeAreaWrapper>
    </>
  );
}
