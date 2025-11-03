// ============================================
// FILE: app/security/guest-waiting.jsx
// Guest Waiting for Approval Screen - UPDATED with proper API calls
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { buildApiUrl, getApiHeaders } from '@/config/apiConfig';
import { getAuthToken } from '@/services/authService';
import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    CheckCircle,
    Clock,
    Home,
    Phone,
    User,
    X,
    XCircle
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const WAITING_TIME = 5 * 60; // 5 minutes in seconds

export default function GuestWaitingScreen() {
  const router = useRouter();
  const { guestId } = useLocalSearchParams();

  const [loading, setLoading] = useState(true);
  const [guestData, setGuestData] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState('pending'); // 'pending', 'approved', 'denied'
  const [timeRemaining, setTimeRemaining] = useState(WAITING_TIME);
  const [canCall, setCanCall] = useState(false);

  // Fetch guest data
  useEffect(() => {
    fetchGuestData();
  }, [guestId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      setCanCall(true);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setCanCall(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Poll for approval status
  useEffect(() => {
    if (approvalStatus !== 'pending') return;

    const pollInterval = setInterval(() => {
      checkApprovalStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(pollInterval);
  }, [approvalStatus, guestId]);

  const fetchGuestData = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(buildApiUrl(`/api/mobile-api/security/guest/${guestId}`), {
        method: 'GET',
        headers: getApiHeaders(token),
      });

      const data = await response.json();

      if (data.success) {
        setGuestData(data.data);
        setApprovalStatus(data.data.status);
      } else {
        Alert.alert('Error', data.error || 'Failed to load guest data');
      }
    } catch (error) {
      console.error('Error fetching guest data:', error);
      Alert.alert('Error', 'Failed to load guest information');
    } finally {
      setLoading(false);
    }
  };

  const checkApprovalStatus = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(buildApiUrl(`/api/mobile-api/security/check-approval/${guestId}`), {
        method: 'GET',
        headers: getApiHeaders(token),
      });

      const data = await response.json();

      if (data.success && data.data.status !== 'pending') {
        setApprovalStatus(data.data.status);
      }
    } catch (error) {
      console.error('Error checking approval:', error);
    }
  };

  const handleCall = () => {
    if (!guestData?.residentPhone) {
      Alert.alert('No Contact', 'No phone number available for this resident.');
      return;
    }

    Alert.alert(
      'Call Resident',
      `Do you want to call ${guestData.residentName || 'the resident'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            Linking.openURL(`tel:${guestData.residentPhone}`);
          },
        },
      ]
    );
  };

  const handleManualEntry = () => {
    Alert.alert(
      'Manual Entry',
      'Allow guest entry without approval?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Allow Entry',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Call manual approval API
              router.replace('/security/home');
            } catch (error) {
              Alert.alert('Error', 'Failed to grant entry');
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaWrapper backgroundColor={theme.colors.background.secondary}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading guest information...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor={theme.colors.background.secondary}>
      <StatusBar style="dark" />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          entering={FadeInUp.duration(600)}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Content */}
        <View style={styles.content}>
          {/* Status Icon */}
          <Animated.View 
            entering={FadeIn.duration(800).delay(200)}
            style={styles.statusIconContainer}
          >
            {approvalStatus === 'pending' && (
              <View style={styles.statusIcon}>
                <Clock size={48} color="#F59E0B" />
              </View>
            )}
            {approvalStatus === 'approved' && (
              <View style={[styles.statusIcon, styles.statusIconSuccess]}>
                <CheckCircle size={48} color="#10B981" />
              </View>
            )}
            {approvalStatus === 'denied' && (
              <View style={[styles.statusIcon, styles.statusIconError]}>
                <XCircle size={48} color="#EF4444" />
              </View>
            )}
          </Animated.View>

          {/* Status Text */}
          <Animated.View 
            entering={FadeInDown.duration(800).delay(300)}
            style={styles.statusTextContainer}
          >
            <Text style={styles.statusTitle}>
              {approvalStatus === 'pending' && 'Waiting for Approval'}
              {approvalStatus === 'approved' && 'Entry Approved!'}
              {approvalStatus === 'denied' && 'Entry Denied'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {approvalStatus === 'pending' && 'Notification sent to resident'}
              {approvalStatus === 'approved' && 'Guest can proceed to the apartment'}
              {approvalStatus === 'denied' && 'Resident has denied entry'}
            </Text>
          </Animated.View>

          {/* Guest Info Card */}
          <Animated.View 
            entering={FadeInDown.duration(800).delay(400)}
            style={styles.guestCard}
          >
            <View style={styles.guestRow}>
              <User size={20} color={theme.colors.text.secondary} />
              <Text style={styles.guestLabel}>Guest Name:</Text>
              <Text style={styles.guestValue}>{guestData?.guestName}</Text>
            </View>
            <View style={styles.guestRow}>
              <Home size={20} color={theme.colors.text.secondary} />
              <Text style={styles.guestLabel}>Visiting:</Text>
              <Text style={styles.guestValue}>{guestData?.flatNumber}</Text>
            </View>
            {guestData?.residentName && (
              <View style={styles.guestRow}>
                <User size={20} color={theme.colors.text.secondary} />
                <Text style={styles.guestLabel}>Resident:</Text>
                <Text style={styles.guestValue}>{guestData?.residentName}</Text>
              </View>
            )}
          </Animated.View>

          {/* Timer or Action Buttons */}
          {approvalStatus === 'pending' && (
            <Animated.View 
              entering={FadeInDown.duration(800).delay(500)}
              style={styles.actionContainer}
            >
              {!canCall ? (
                <View style={styles.timerCard}>
                  <Clock size={24} color={theme.colors.primary.blue} />
                  <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
                  <Text style={styles.timerLabel}>Time remaining to call</Text>
                </View>
              ) : (
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.callButton}
                    onPress={handleCall}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#3B82F6', '#2563EB']}
                      style={styles.callButtonGradient}
                    >
                      <Phone size={20} color="#FFFFFF" />
                      <Text style={styles.callButtonText}>Call Resident</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.manualButton}
                    onPress={handleManualEntry}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.manualButtonText}>Manual Entry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          )}

          {/* Approved - Entry Button */}
          {approvalStatus === 'approved' && (
            <Animated.View 
              entering={FadeInDown.duration(800).delay(500)}
              style={styles.actionContainer}
            >
              <TouchableOpacity
                style={styles.entryButton}
                onPress={() => router.replace('/security/home')}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.entryButtonGradient}
                >
                  <CheckCircle size={20} color="#FFFFFF" />
                  <Text style={styles.entryButtonText}>Grant Entry</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Denied - Back Button */}
          {approvalStatus === 'denied' && (
            <Animated.View 
              entering={FadeInDown.duration(800).delay(500)}
              style={styles.actionContainer}
            >
              <TouchableOpacity
                style={styles.backButtonLarge}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>Go Back</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.base,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },

  // Header
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    alignItems: 'center',
  },

  // Status Icon
  statusIconContainer: {
    marginBottom: theme.spacing.xl,
  },
  statusIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusIconError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },

  // Status Text
  statusTextContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  statusTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },

  // Guest Card
  guestCard: {
    width: '100%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  guestLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  guestValue: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },

  // Timer
  timerCard: {
    width: '100%',
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xxl,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  timerText: {
    fontSize: 48,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
    marginTop: theme.spacing.md,
  },
  timerLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },

  // Action Container
  actionContainer: {
    width: '100%',
  },

  // Buttons
  buttonsContainer: {
    width: '100%',
    gap: theme.spacing.base,
  },
  callButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  callButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.base,
  },
  callButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
  manualButton: {
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },

  // Entry Button
  entryButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  entryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.base,
  },
  entryButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },

  // Back Button
  backButtonLarge: {
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.primary,
    borderWidth: 1.5,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
});