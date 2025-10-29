// ============================================
// FILE: app/security/home.jsx
// ============================================
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import theme from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    Bell,
    ChevronRight,
    ClipboardList,
    LogOut,
    QrCode,
    Scan,
    Shield,
    Upload,
    User,
} from "lucide-react-native";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function SecurityHomeScreen() {
  const router = useRouter();

  const handleScanQR = () => {
    router.push("/security/scan-qr");
  };

  const handleUploadGuest = () => {
    router.push("/security/upload-guest");
  };

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <SafeAreaWrapper backgroundColor={theme.colors.background.secondary}>
      <StatusBar style="dark" />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={["#10B981", "#059669"]}
                  style={styles.avatar}
                >
                  <Shield size={24} color="#FFFFFF" strokeWidth={2.5} />
                </LinearGradient>
              </View>
              <View>
                <Text style={styles.greeting}>Good Morning</Text>
                <Text style={styles.name}>Security Officer</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Bell size={24} color={theme.colors.text.primary} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {/* Status Card */}
          <Animated.View entering={FadeInUp.duration(600).delay(100)}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusCard}
            >
              <View style={styles.statusCardContent}>
                <View style={styles.statusLeft}>
                  <Text style={styles.statusLabel}>Today's Status</Text>
                  <Text style={styles.statusValue}>Active Duty</Text>
                </View>
                <View style={styles.statusIcon}>
                  <Shield size={32} color="#FFFFFF" strokeWidth={2} />
                </View>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.statusStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>24</Text>
                  <Text style={styles.statLabel}>Visitors</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>8h</Text>
                  <Text style={styles.statLabel}>On Duty</Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* Main Actions */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(200)}
          style={styles.actionsSection}
        >
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* Scan QR Card */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={handleScanQR}
          >
            <LinearGradient
              colors={["rgba(59, 130, 246, 0.1)", "rgba(59, 130, 246, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={["#3B82F6", "#2563EB"]}
                    style={styles.actionIcon}
                  >
                    <QrCode size={32} color="#FFFFFF" strokeWidth={2} />
                  </LinearGradient>
                </View>

                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Scan QR Code</Text>
                  <Text style={styles.actionDescription}>
                    Quickly verify visitor entry with QR scan
                  </Text>
                  <View style={styles.actionFeatures}>
                    <View style={styles.featureBadge}>
                      <Scan size={14} color="#3B82F6" />
                      <Text style={styles.featureBadgeText}>Fast Entry</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionArrow}>
                  <View style={styles.actionArrowCircle}>
                    <ChevronRight size={20} color="#3B82F6" strokeWidth={2.5} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Upload Guest Details Card */}
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.7}
            onPress={handleUploadGuest}
          >
            <LinearGradient
              colors={["rgba(139, 92, 246, 0.1)", "rgba(139, 92, 246, 0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionIconContainer}>
                  <LinearGradient
                    colors={["#8B5CF6", "#7C3AED"]}
                    style={styles.actionIcon}
                  >
                    <Upload size={32} color="#FFFFFF" strokeWidth={2} />
                  </LinearGradient>
                </View>

                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Upload Guest Details</Text>
                  <Text style={styles.actionDescription}>
                    Manual entry for walk-in visitors
                  </Text>
                  <View style={styles.actionFeatures}>
                    <View
                      style={[styles.featureBadge, styles.featureBadgePurple]}
                    >
                      <ClipboardList size={14} color="#8B5CF6" />
                      <Text
                        style={[styles.featureBadgeText, { color: "#8B5CF6" }]}
                      >
                        Manual Entry
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.actionArrow}>
                  <View
                    style={[styles.actionArrowCircle, styles.actionArrowPurple]}
                  >
                    <ChevronRight size={20} color="#8B5CF6" strokeWidth={2.5} />
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(300)}
          style={styles.recentSection}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {[1, 2, 3].map((item, index) => (
              <View key={item} style={styles.activityItem}>
                <View style={styles.activityIconContainer}>
                  <User size={20} color={theme.colors.primary.blue} />
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Visitor Entry</Text>
                  <Text style={styles.activityTime}>{index + 1} min ago</Text>
                </View>
                <View style={styles.activityStatus}>
                  <View style={styles.statusDotGreen} />
                  <Text style={styles.activityStatusText}>Verified</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Logout Button */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.base,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  avatarContainer: {
    padding: 2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(16, 185, 129, 0.3)",
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  name: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginTop: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },

  // Status Card
  statusCard: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  statusCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusLeft: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: theme.spacing.xs,
  },
  statusValue: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginVertical: theme.spacing.base,
  },
  statusStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: "rgba(255, 255, 255, 0.7)",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },

  // Actions Section
  actionsSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.base,
  },
  actionCard: {
    marginBottom: theme.spacing.base,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  actionCardGradient: {
    borderWidth: 1.5,
    borderColor: "rgba(59, 130, 246, 0.2)",
    borderRadius: theme.borderRadius.xl,
  },
  actionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  actionIconContainer: {
    marginRight: theme.spacing.base,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  actionFeatures: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  featureBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
  },
  featureBadgePurple: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  featureBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#3B82F6",
  },
  actionArrow: {
    marginLeft: theme.spacing.sm,
  },
  actionArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionArrowPurple: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderColor: "rgba(139, 92, 246, 0.2)",
  },

  // Recent Activity
  recentSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.base,
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  activityList: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    padding: theme.spacing.sm,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xs,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  activityStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
  },
  activityStatusText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: "#10B981",
  },

  // Logout Button
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1.5,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#EF4444",
  },

  bottomSpacer: {
    height: theme.spacing.xxxl,
  },
});
