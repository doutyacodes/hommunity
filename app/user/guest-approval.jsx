// ============================================
// FILE: app/user/guest-approval.jsx
// Guest Approval Screen - Modern UI with Polling & Member Verification
// ============================================
import { API_ENDPOINTS, buildApiUrl, getApiHeaders } from '@/config/apiConfig';
import { getAuthToken } from '@/services/authService';
import { borderRadius, colors, shadows, spacing, typography } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const POLL_INTERVAL = 5000; // Poll every 5 seconds

export default function GuestApprovalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [guestDetails, setGuestDetails] = useState(null);
  const [alreadyProcessed, setAlreadyProcessed] = useState(false);
  const [processedBy, setProcessedBy] = useState(null);
  const [isPrivateMember, setIsPrivateMember] = useState(false);

  // Polling
  const pollIntervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Extract params from notification
  const guestId = params.guestId;
  const guestName = params.guestName || 'Guest';
  const apartmentNumber = params.apartmentNumber || '';
  const timestamp = params.timestamp || '';
  const vehicleNumber = params.vehicleNumber || '';
  const photoFilename = params.photoFilename || '';

  useEffect(() => {
    if (guestId && guestName) {
      setGuestDetails({
        id: guestId,
        guestName,
        apartmentNumber,
        vehicleNumber,
        photoFilename,
        timestamp,
      });
      fetchGuestDetails();
    } else {
      fetchGuestDetails();
    }

    // Start polling
    startPolling();

    // Cleanup
    return () => {
      stopPolling();
    };
  }, [guestId]);

  // Pulse animation for pending approval
  useEffect(() => {
    if (!alreadyProcessed) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [alreadyProcessed]);

  const startPolling = () => {
    // Poll immediately
    checkApprovalStatus();

    // Then poll every 5 seconds
    pollIntervalRef.current = setInterval(() => {
      checkApprovalStatus();
    }, POLL_INTERVAL);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  const checkApprovalStatus = async () => {
    if (!guestId) return;

    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(`/api/mobile-api/user/guest-details?guestId=${guestId}`),
        {
          method: 'GET',
          headers: getApiHeaders(token),
        }
      );

      const data = await response.json();

      if (data.success && data.data) {
        const guest = data.data;

        // Check if already approved or denied
        if (guest.status === 'approved' || guest.status === 'denied') {
          setAlreadyProcessed(true);
          setProcessedBy(guest.approvedBy || 'Someone');
          stopPolling();

          // Auto-redirect after 3 seconds
          setTimeout(() => {
            router.back();
          }, 3000);
        }

        // Check if created by a member (private)
        if (guest.createdByMemberId) {
          setIsPrivateMember(true);
        }

        setGuestDetails(guest);
      }
    } catch (error) {
      // console.error('Error checking approval status:', error);
      // Continue polling even on error
    }
  };

  const fetchGuestDetails = async () => {
    if (!guestId) return;

    setLoading(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(`/api/mobile-api/user/guest-details?guestId=${guestId}`),
        {
          method: 'GET',
          headers: getApiHeaders(token),
        }
      );

      const data = await response.json();

      if (data.success) {
        const guest = data.data;

        // Check if already processed
        if (guest.status === 'approved' || guest.status === 'denied') {
          setAlreadyProcessed(true);
          setProcessedBy(guest.approvedBy || 'Someone');
          stopPolling();
        }

        // Check if created by member
        if (guest.createdByMemberId) {
          setIsPrivateMember(true);
        }

        setGuestDetails(guest);
      } else {
        // Alert.alert('Error', data.error || 'Failed to fetch guest details');
      }
    } catch (error) {
      // console.error('Error fetching guest:', error);
      // Alert.alert('Error', 'Failed to load guest details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved) => {
    stopPolling(); // Stop polling while processing
    setProcessing(true);

    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.APPROVE_GUEST),
        {
          method: 'POST',
          headers: getApiHeaders(token),
          body: JSON.stringify({
            guestId: guestId,
            approvalStatus: approved ? 'approved' : 'denied',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setAlreadyProcessed(true);

        Alert.alert(
          approved ? '✅ Guest Approved' : '❌ Guest Denied',
          approved
            ? `${guestName} has been granted access`
            : `${guestName}'s entry has been denied`,
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        // If error is "already processed", handle it gracefully
        if (data.error.includes('already')) {
          setAlreadyProcessed(true);
          // Alert.alert('Notice', 'This guest has already been processed by someone else', [
            // { text: 'OK', onPress: () => router.back() },
          // ]);
        } else {
          // Alert.alert('Error', data.error || 'Failed to process approval');
          // startPolling(); // Resume polling on error
        }
      }
    } catch (error) {
      // console.error('Error processing approval:', error);
      // Alert.alert('Error', 'Failed to process your request');
      startPolling(); // Resume polling on error
    } finally {
      setProcessing(false);
    }
  };

  const confirmApproval = (approved) => {
    Alert.alert(
      approved ? 'Approve Guest?' : 'Deny Guest?',
      approved
        ? `Allow ${guestName} to enter?`
        : `Deny entry to ${guestName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: approved ? 'Approve' : 'Deny',
          style: approved ? 'default' : 'destructive',
          onPress: () => handleApproval(approved),
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading guest details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!guestDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.status.error} />
          <Text style={styles.errorText}>Guest details not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        day: 'numeric',
        month: 'short',
      })
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Guest Approval</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Alert Banner */}
        {!alreadyProcessed ? (
          <Animated.View style={[styles.alertBanner, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={[colors.primaryShades.blue100, colors.primaryShades.blue50]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.alertBannerGradient}
            >
              <View style={styles.alertIconContainer}>
                <Ionicons name="notifications" size={32} color={colors.primary.blue} />
              </View>
              <Text style={styles.alertTitle}>New Guest at Gate</Text>
              <Text style={styles.alertSubtitle}>Please approve or deny entry</Text>

              {isPrivateMember && (
                <View style={styles.privateBadge}>
                  <Ionicons name="lock-closed" size={14} color={colors.primary.purple} />
                  <Text style={styles.privateBadgeText}>Private Guest (Member)</Text>
                </View>
              )}
            </LinearGradient>
          </Animated.View>
        ) : (
          <View style={styles.processedBanner}>
            <LinearGradient
              colors={
                guestDetails.status === 'approved'
                  ? [colors.status.successLight, colors.status.success]
                  : [colors.status.errorLight, colors.status.error]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.processedBannerGradient}
            >
              <Ionicons
                name={guestDetails.status === 'approved' ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={colors.neutral.white}
              />
              <Text style={styles.processedTitle}>
                {guestDetails.status === 'approved' ? 'Already Approved' : 'Already Denied'}
              </Text>
              <Text style={styles.processedSubtitle}>
                This guest was {guestDetails.status} by {processedBy}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* Guest Photo */}
        {photoFilename ? (
          <View style={styles.photoContainer}>
            <Image
              source={{
                uri: `https://wowfy.in/gatewise/guest_images/${photoFilename}`,
              }}
              style={styles.guestPhoto}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.photoOverlay}
            />
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <LinearGradient
              colors={[colors.primaryShades.blue50, colors.primaryShades.purple50]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.photoPlaceholderGradient}
            >
              <Ionicons name="person-outline" size={80} color={colors.primary.blue} />
            </LinearGradient>
          </View>
        )}

        {/* Guest Details Card */}
        <View style={styles.detailsCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
            style={styles.detailsCardGradient}
          >
            <DetailRow
              icon="person"
              label="Guest Name"
              value={guestDetails.guestName}
              iconColor={colors.primary.blue}
            />
            <DetailRow
              icon="home"
              label="Apartment"
              value={apartmentNumber}
              iconColor={colors.primary.purple}
            />
            {vehicleNumber && (
              <DetailRow
                icon="car"
                label="Vehicle"
                value={vehicleNumber}
                iconColor={colors.primary.cyan}
              />
            )}
            <DetailRow
              icon="time"
              label="Arrival Time"
              value={formattedTime}
              iconColor={colors.status.warning}
            />
            {guestDetails.guestPhone && (
              <DetailRow
                icon="call"
                label="Phone"
                value={guestDetails.guestPhone}
                iconColor={colors.status.success}
              />
            )}
            {guestDetails.purpose && (
              <DetailRow
                icon="information-circle"
                label="Purpose"
                value={guestDetails.purpose}
                iconColor={colors.status.info}
              />
            )}
          </LinearGradient>
        </View>

        {/* Action Buttons - Only show if not processed */}
        {!alreadyProcessed && (
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() => confirmApproval(false)}
              disabled={processing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.status.error, '#DC2626']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                {processing ? (
                  <ActivityIndicator color={colors.neutral.white} />
                ) : (
                  <>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="close-circle" size={24} color={colors.neutral.white} />
                    </View>
                    <Text style={styles.actionButtonText}>Deny Entry</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButtonWrapper}
              onPress={() => confirmApproval(true)}
              disabled={processing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.status.success, '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionButtonGradient}
              >
                {processing ? (
                  <ActivityIndicator color={colors.neutral.white} />
                ) : (
                  <>
                    <View style={styles.actionIconContainer}>
                      <Ionicons name="checkmark-circle" size={24} color={colors.neutral.white} />
                    </View>
                    <Text style={styles.actionButtonText}>Approve Entry</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for detail rows
function DetailRow({ icon, label, value, iconColor }) {
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    fontFamily: typography.fonts.semibold,
  },
  backButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary.blue,
    borderRadius: spacing.sm,
  },
  backButtonText: {
    color: colors.neutral.white,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  backIcon: {
    padding: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.gray50,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },

  // Alert Banner
  alertBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  alertBannerGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  alertIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.neutral.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.md,
  },
  alertTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  alertSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primaryShades.purple100,
    borderRadius: borderRadius.full,
  },
  privateBadgeText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.semibold,
    color: colors.primary.purple,
  },

  // Processed Banner
  processedBanner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  processedBannerGradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  processedTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.neutral.white,
    marginTop: spacing.md,
  },
  processedSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.neutral.white,
    marginTop: spacing.xs,
    opacity: 0.9,
  },

  // Photo
  photoContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  guestPhoto: {
    width: '100%',
    height: 320,
    backgroundColor: colors.neutral.gray100,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  photoPlaceholder: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.md,
  },
  photoPlaceholderGradient: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Details Card
  detailsCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.lg,
  },
  detailsCardGradient: {
    padding: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray100,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.text.tertiary,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text.primary,
  },

  // Action Buttons
  actionContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButtonWrapper: {
    flex: 1,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    ...shadows.xl,
  },
  actionButtonGradient: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    color: colors.neutral.white,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
});
