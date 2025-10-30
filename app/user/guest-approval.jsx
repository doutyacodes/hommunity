// ============================================
// FILE: app/user/guest-approval.jsx
// Guest Approval Screen - Accept/Reject Guest
// ============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, shadows } from '@/theme';
import { buildApiUrl, API_ENDPOINTS, getApiHeaders } from '@/config/apiConfig';
import { getAuthToken } from '@/services/authService';

export default function GuestApprovalScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [guestDetails, setGuestDetails] = useState(null);

  // Extract params from notification
  const guestId = params.guestId;
  const guestName = params.guestName || 'Guest';
  const apartmentNumber = params.apartmentNumber || '';
  const timestamp = params.timestamp || '';
  const vehicleNumber = params.vehicleNumber || '';
  const photoFilename = params.photoFilename || '';

  useEffect(() => {
    // If we have minimal data from notification, use it
    // Otherwise fetch full details
    if (guestId && guestName) {
      setGuestDetails({
        id: guestId,
        guestName,
        apartmentNumber,
        vehicleNumber,
        photoFilename,
        timestamp,
      });
    } else {
      fetchGuestDetails();
    }
  }, [guestId]);

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
        setGuestDetails(data.data);
      } else {
        Alert.alert('Error', data.error || 'Failed to fetch guest details');
      }
    } catch (error) {
      console.error('Error fetching guest:', error);
      Alert.alert('Error', 'Failed to load guest details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approved) => {
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
        Alert.alert(
          approved ? 'Guest Approved' : 'Guest Denied',
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
        Alert.alert('Error', data.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      Alert.alert('Error', 'Failed to process your request');
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
        <View style={styles.alertBanner}>
          <Ionicons name="notifications-outline" size={32} color={colors.primary.blue} />
          <Text style={styles.alertTitle}>New Guest at Gate</Text>
          <Text style={styles.alertSubtitle}>Please approve or deny entry</Text>
        </View>

        {/* Guest Photo */}
        {photoFilename ? (
          <View style={styles.photoContainer}>
            <Image
              source={{
                uri: `${buildApiUrl('/uploads/guests/' + photoFilename)}`,
              }}
              style={styles.guestPhoto}
              resizeMode="cover"
            />
          </View>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="person-outline" size={80} color={colors.neutral.gray400} />
          </View>
        )}

        {/* Guest Details Card */}
        <View style={styles.detailsCard}>
          <DetailRow
            icon="person"
            label="Guest Name"
            value={guestDetails.guestName}
          />
          <DetailRow
            icon="home"
            label="Apartment"
            value={apartmentNumber}
          />
          {vehicleNumber && (
            <DetailRow
              icon="car"
              label="Vehicle"
              value={vehicleNumber}
            />
          )}
          <DetailRow
            icon="time"
            label="Arrival Time"
            value={formattedTime}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.denyButton]}
            onPress={() => confirmApproval(false)}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={colors.neutral.white} />
            ) : (
              <>
                <Ionicons name="close-circle" size={24} color={colors.neutral.white} />
                <Text style={styles.actionButtonText}>Deny Entry</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => confirmApproval(true)}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator color={colors.neutral.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color={colors.neutral.white} />
                <Text style={styles.actionButtonText}>Approve Entry</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component for detail rows
function DetailRow({ icon, label, value }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={20} color={colors.primary.blue} />
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
    paddingBottom: spacing.xl,
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
  },
  backIcon: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  alertBanner: {
    backgroundColor: colors.primaryShades.blue50,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primaryShades.blue200,
  },
  alertTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  alertSubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  photoContainer: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: spacing.md,
    overflow: 'hidden',
    ...shadows.medium,
  },
  guestPhoto: {
    width: '100%',
    height: 300,
    backgroundColor: colors.neutral.gray100,
  },
  photoPlaceholder: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    height: 300,
    backgroundColor: colors.neutral.gray100,
    borderRadius: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    borderRadius: spacing.md,
    padding: spacing.lg,
    ...shadows.small,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.gray100,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryShades.blue50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    marginBottom: spacing.xxs,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text.primary,
  },
  actionContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: spacing.md,
    gap: spacing.sm,
    ...shadows.medium,
  },
  denyButton: {
    backgroundColor: colors.status.error,
  },
  approveButton: {
    backgroundColor: colors.status.success,
  },
  actionButtonText: {
    color: colors.neutral.white,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
});
