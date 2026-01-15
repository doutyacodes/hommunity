// ============================================
// FILE: components/user/ApartmentHeader.jsx
// Common Header with Apartment Switcher
// Shows current apartment and allows switching
// ============================================

import { useApartment } from "@/providers/ApartmentProvider";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================
// DUMMY DATA FOR TESTING
// ============================================

// Single apartment scenario
const singleApartmentData = {
  success: true,
  apartment: {
    id: "apt_001",
    towerName: "Tower A",
    apartmentNumber: "304",
    communityName: "Prestige Lakeside Habitat",
  },
  allApartments: [
    {
      id: "apt_001",
      towerName: "Tower A",
      apartmentNumber: "304",
      communityName: "Prestige Lakeside Habitat",
    },
  ],
};

// Multiple apartments scenario
const multipleApartmentsData = {
  success: true,
  apartment: {
    id: "apt_001",
    towerName: "Tower A",
    apartmentNumber: "304",
    communityName: "Prestige Lakeside Habitat",
  },
  allApartments: [
    {
      id: "apt_001",
      towerName: "Tower A",
      apartmentNumber: "304",
      communityName: "Prestige Lakeside Habitat",
    },
    {
      id: "apt_002",
      towerName: "Tower B",
      apartmentNumber: "502",
      communityName: "Brigade Meadows",
    },
    {
      id: "apt_003",
      towerName: "Phase 2",
      apartmentNumber: "1201",
      communityName: "Sobha Dream Acres",
    },
  ],
};

// No apartments scenario
const noApartmentsData = {
  success: true,
  apartment: null,
  allApartments: [],
};

// Apartment without tower name
const apartmentWithoutTowerData = {
  success: true,
  apartment: {
    id: "apt_004",
    towerName: null,
    apartmentNumber: "B-405",
    communityName: "Mantri Espana",
  },
  allApartments: [
    {
      id: "apt_004",
      towerName: null,
      apartmentNumber: "B-405",
      communityName: "Mantri Espana",
    },
  ],
};

// Long community name scenario
const longNameData = {
  success: true,
  apartment: {
    id: "apt_005",
    towerName: "Wing C",
    apartmentNumber: "1804",
    communityName: "Purva Venezia Premium Lifestyle Community",
  },
  allApartments: [
    {
      id: "apt_005",
      towerName: "Wing C",
      apartmentNumber: "1804",
      communityName: "Purva Venezia Premium Lifestyle Community",
    },
  ],
};

export default function ApartmentHeader() {
  const router = useRouter();
  const {
    currentApartment,
    userApartments,
    loading,
    isApartmentAvailable,
    hasMultipleApartments,
    refreshApartment,
  } = useApartment();

  const handleApartmentPress = () => {
    if (hasMultipleApartments) {
      router.push("/switch-apartments");
    } else if (!isApartmentAvailable) {
      router.push("/user/add-apartment");
    }
  };

  if (loading || !isApartmentAvailable) {
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
            <Image
              source={require("@/assets/company/icon.png")}
              style={styles.logo}
              contentFit="contain"
            />
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
  logo: {
    width: 32,
    height: 32,
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
