// ============================================
// FILE: app/index.jsx
// Onboarding with Authentication Check - UPDATED
// ============================================
import { getUserData, getUserType, isAuthenticated } from "@/services/authService";
import theme from "@/theme";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronRight, Lock, Shield, User } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";

const { height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const authenticated = await isAuthenticated();

      if (authenticated) {
        console.log('✅ User is authenticated, checking user type...');
        
        // Get user type and redirect accordingly
        const userType = await getUserType();
        const userData = await getUserData();

        console.log('👤 User Type:', userType);

        if (userType === 'security') {
          console.log('🔐 Redirecting to security home...');
          router.replace('/security/home');
        } else if (userType === 'user' || userType === 'resident') {
          console.log('🏠 Redirecting to user home...');
          // router.replace('/home');
          router.replace('/home');
        } else if (userType === 'admin' || userType === 'superadmin') {
          console.log('👨‍💼 Redirecting to admin dashboard...');
          router.replace('/admin/dashboard');
        } else {
          console.log('⚠️ Unknown user type:', userType);
          // Stay on onboarding if user type is unknown
          setIsCheckingAuth(false);
        }
      } else {
        console.log('🔓 User not authenticated, showing onboarding...');
        setIsCheckingAuth(false);
      }
    } catch (error) {
      console.error('❌ Auth check error:', error);
      setIsCheckingAuth(false);
    }
  };

  const handleUserLogin = () => {
    router.push("/(auth)/user-login");
  };

  const handleSecurityLogin = () => {
    router.push("/(auth)/security-login");
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={["#1E40AF", "#3B82F6", "#8B5CF6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background Gradient */}
      <LinearGradient
        colors={["#1E40AF", "#3B82F6", "#8B5CF6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Animated Background Circles */}
      <Animated.View
        entering={FadeIn.duration(1000)}
        style={[styles.circle, styles.circle1]}
      />
      <Animated.View
        entering={FadeIn.duration(1200).delay(200)}
        style={[styles.circle, styles.circle2]}
      />
      <Animated.View
        entering={FadeIn.duration(1400).delay(400)}
        style={[styles.circle, styles.circle3]}
      />

      {/* Content Container */}
      <View style={styles.content}>
        {/* Logo & Title Section */}
        <Animated.View
          entering={FadeInUp.duration(800).springify()}
          style={styles.headerSection}
        >
          {/* Logo with border instead of shadow */}
          <View style={styles.logoContainer}>
            <View style={styles.logoOuterBorder}>
              <LinearGradient
                colors={["#FFFFFF", "#F0F9FF"]}
                style={styles.logoGradient}
              >
                <Shield
                  size={48}
                  color={theme.colors.primary.blue}
                  strokeWidth={2.5}
                />
              </LinearGradient>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Hommunity</Text>
          <Text style={styles.subtitle}>Secure Access Management</Text>

          {/* Features with modern pill design */}
          <View style={styles.featuresContainer}>
            <View style={styles.featurePill}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Contactless Entry</Text>
            </View>
            <View style={styles.featurePill}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Real-time Tracking</Text>
            </View>
            <View style={styles.featurePill}>
              <View style={styles.featureDot} />
              <Text style={styles.featureText}>Digital Passes</Text>
            </View>
          </View>
        </Animated.View>

        {/* Role Selection Cards */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(300).springify()}
          style={styles.cardsContainer}
        >
          <Text style={styles.selectText}>Continue as</Text>

          {/* User/Resident Card */}
          <Animated.View entering={SlideInRight.duration(600).delay(400)}>
            <TouchableOpacity
              style={styles.roleCard}
              activeOpacity={0.7}
              onPress={handleUserLogin}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.roleCardGradient}
              >
                <View style={styles.roleCardContent}>
                  <View style={styles.roleIconContainer}>
                    <LinearGradient
                      colors={[
                        "rgba(59, 130, 246, 0.6)",
                        "rgba(59, 130, 246, 0.3)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.roleIconBackground}
                    >
                      <User size={28} color="#FFFFFF" strokeWidth={2} />
                    </LinearGradient>
                  </View>

                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Resident</Text>
                    <Text style={styles.roleDescription}>
                      Manage visitors, create passes & more
                    </Text>
                  </View>

                  <View style={styles.roleArrowContainer}>
                    <View style={styles.roleArrowCircle}>
                      <ChevronRight
                        size={20}
                        color="#FFFFFF"
                        strokeWidth={2.5}
                      />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Security Card */}
          <Animated.View entering={SlideInRight.duration(600).delay(500)}>
            <TouchableOpacity
              style={styles.roleCard}
              activeOpacity={0.7}
              onPress={handleSecurityLogin}
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.2)",
                  "rgba(255, 255, 255, 0.1)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.roleCardGradient}
              >
                <View style={styles.roleCardContent}>
                  <View style={styles.roleIconContainer}>
                    <LinearGradient
                      colors={[
                        "rgba(16, 185, 129, 0.6)",
                        "rgba(16, 185, 129, 0.3)",
                      ]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.roleIconBackground}
                    >
                      <Lock size={28} color="#FFFFFF" strokeWidth={2} />
                    </LinearGradient>
                  </View>

                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>Security</Text>
                    <Text style={styles.roleDescription}>
                      Verify visitors & manage entry logs
                    </Text>
                  </View>

                  <View style={styles.roleArrowContainer}>
                    <View style={styles.roleArrowCircle}>
                      <ChevronRight
                        size={20}
                        color="#FFFFFF"
                        strokeWidth={2.5}
                      />
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(600)}
          style={styles.footer}
        >
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>© 2025 Hommunity</Text>
          <Text style={styles.footerSubtext}>Powered by Modern Security</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary.blue,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.giant,
    paddingBottom: theme.spacing.xxl,
    justifyContent: "space-between",
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary.blue,
  },
  loadingText: {
    marginTop: theme.spacing.base,
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: "#FFFFFF",
  },

  // Animated Background Circles
  circle: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  circle1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    top: height * 0.3,
    right: -30,
  },

  // Header Section
  headerSection: {
    alignItems: "center",
    marginTop: theme.spacing.huge,
  },
  logoContainer: {
    marginBottom: theme.spacing.lg,
  },
  logoOuterBorder: {
    padding: 4,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 42,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
    marginBottom: theme.spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: theme.spacing.xl,
  },

  // Features with modern pill design
  featuresContainer: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: theme.spacing.md,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  featureText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: "rgba(255, 255, 255, 0.95)",
  },

  // Role Selection Cards
  cardsContainer: {
    gap: theme.spacing.base,
  },
  selectText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  roleCard: {
    marginBottom: theme.spacing.base,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
  },
  roleCardGradient: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  roleCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  roleIconContainer: {
    marginRight: theme.spacing.base,
  },
  roleIconBackground: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
    marginBottom: theme.spacing.xxs,
  },
  roleDescription: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 20,
  },
  roleArrowContainer: {
    marginLeft: theme.spacing.sm,
  },
  roleArrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: theme.spacing.xl,
  },
  footerDivider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    marginBottom: theme.spacing.md,
  },
  footerText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: theme.spacing.xxs,
  },
  footerSubtext: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.regular,
    color: "rgba(255, 255, 255, 0.5)",
  },
});