// ============================================
// FILE: components/user/ApartmentHeader.jsx
// Common Header with Apartment Switcher
// Shows current apartment and allows switching
// ============================================

import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ApartmentHeader() {
  const router = useRouter();
  const [currentApartment, setCurrentApartment] = useState(null);
  const [userApartments, setUserApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentApartment();
  }, []);

  const loadCurrentApartment = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      // Get user's current apartment
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.GET_CURRENT_APARTMENT),
        {
          method: "POST", // 👈 IMPORTANT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }), // 👈 send token in body
        }
      );

      const data = await response.json();
      console.log("Current Apartment response:", data);
      if (data.success && data.apartment) {
        setCurrentApartment(data.apartment);
        setUserApartments(data.allApartments || []);
      }
    } catch (error) {
      console.error("Error loading apartment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApartmentPress = () => {
    if (userApartments.length > 1) {
      // Navigate to apartment switcher
      router.push("/user/select-apartment");
    } else if (userApartments.length === 0) {
      // Navigate to add apartment
      router.push("/user/add-apartment");
    }
  };

  if (loading || !currentApartment) {
    return (
      <View style={[styles.header, styles.loadingHeader]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={colors.background.primary}
        />
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.background.primary}
      />

      <View style={styles.content}>
        {/* Left: App Logo/Name */}
        <View style={styles.leftSection}>
          <View style={styles.logoContainer}>
            <Ionicons name="business" size={24} color={colors.primary.blue} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.appName}>Hommunity</Text>
            <Text style={styles.subtitle}>Guest Management</Text>
          </View>
        </View>

        {/* Right: Current Apartment Switcher */}
        <TouchableOpacity
          style={styles.apartmentButton}
          onPress={handleApartmentPress}
          activeOpacity={0.7}
        >
          <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentLabel}>
              {currentApartment.towerName || "Tower"}{" "}
              {currentApartment.apartmentNumber}
            </Text>
            <Text style={styles.communityName} numberOfLines={1}>
              {currentApartment.communityName}
            </Text>
          </View>
          {userApartments.length > 1 && (
            <Ionicons
              name="chevron-down"
              size={18}
              color={colors.text.secondary}
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background.primary,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 45,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  loadingHeader: {
    paddingHorizontal: spacing.base,
  },
  loadingPlaceholder: {
    height: 50,
    backgroundColor: colors.neutral.gray100,
    borderRadius: borderRadius.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  logoContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primaryShades.blue50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  appName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  apartmentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginLeft: spacing.sm,
  },
  apartmentInfo: {
    marginRight: spacing.xs,
  },
  apartmentLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.text.primary,
    textAlign: "right",
  },
  communityName: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xxs,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: "right",
    maxWidth: 100,
  },
});
