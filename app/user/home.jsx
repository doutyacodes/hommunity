// ============================================
// FILE: app/(user)/user/home.jsx
// User Home Screen - View Apartments (Owned & Rented)
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { API_ENDPOINTS, buildApiUrl, getApiHeaders } from '@/config/apiConfig';
import { useNotification } from '@/contexts/NotificationContext';
import { getAuthToken } from '@/services/authService';
import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Building2,
  Home as HomeIcon,
  MapPin,
  Plus,
  Shield,
  Users
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function UserHomeScreen() {
  const router = useRouter();
  const { registerForNotifications, fcmToken, expoPushToken } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ownedApartments, setOwnedApartments] = useState([]);
  const [rentedApartments, setRentedApartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApartments();

    // Register for notifications after login
    registerForNotifications().then(async (result) => {
      if (result.success) {
        console.log('✅ Notifications registered successfully');
        console.log('FCM Token:', result.fcmToken);
        console.log('Expo Token:', result.expoPushToken);

        // Save tokens to backend
        try {
          const token = await getAuthToken();
          const response = await fetch(
            buildApiUrl(API_ENDPOINTS.UPDATE_PUSH_TOKEN),
            {
              method: 'POST',
              headers: getApiHeaders(token),
              body: JSON.stringify({
                fcmToken: result.fcmToken,
                expoPushToken: result.expoPushToken,
              }),
            }
          );

          const data = await response.json();
          if (data.success) {
            console.log('✅ Push tokens saved to backend');
          } else {
            console.log('⚠️ Failed to save tokens:', data.error);
          }
        } catch (err) {
          console.error('❌ Error saving tokens:', err);
        }
      } else {
        console.log('⚠️ Failed to register notifications:', result.error);
      }
    });
  }, []);

  const fetchApartments = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.GET_MY_APARTMENTS),
        {
          method: 'GET',
          headers: getApiHeaders(token),
        }
      );

      const data = await response.json();

      if (data.success) {
        setOwnedApartments(data.data.owned || []);
        setRentedApartments(data.data.rented || []);
        setError('');
      } else {
        setError(data.error || 'Failed to load apartments');
      }
    } catch (err) {
      console.error('Fetch apartments error:', err);
      setError('Failed to load apartments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchApartments();
  };

  const renderApartmentCard = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.duration(600).delay(index * 100)}
      style={styles.card}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F9FAFB']}
        style={styles.cardGradient}
      >
        {/* Community Image */}
        {item.communityImage ? (
          <Image
            source={{ uri: item.communityImage }}
            style={styles.communityImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.communityImagePlaceholder}>
            <Building2 size={32} color={theme.colors.neutral.gray400} />
          </View>
        )}

        {/* Apartment Details */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.apartmentInfo}>
              <Text style={styles.apartmentNumber}>
                {item.towerName ? `${item.towerName} - ` : ''}
                {item.apartmentNumber}
              </Text>
              {item.floorNumber && (
                <Text style={styles.floorText}>Floor {item.floorNumber}</Text>
              )}
            </View>
            <View
              style={[
                styles.badge,
                item.ownershipType === 'owner'
                  ? styles.ownerBadge
                  : styles.tenantBadge,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  item.ownershipType === 'owner'
                    ? styles.ownerBadgeText
                    : styles.tenantBadgeText,
                ]}
              >
                {item.ownershipType === 'owner' ? 'Owned' : 'Rented'}
              </Text>
            </View>
          </View>

          <View style={styles.communityInfo}>
            <Building2 size={16} color={theme.colors.primary.blue} />
            <Text style={styles.communityName}>{item.communityName}</Text>
          </View>

          <View style={styles.addressRow}>
            <MapPin size={14} color={theme.colors.neutral.gray500} />
            <Text style={styles.addressText} numberOfLines={2}>
              {item.district && item.state
                ? `${item.district}, ${item.state}`
                : item.communityAddress}
            </Text>
          </View>

          {/* Status */}
          <View style={styles.statusRow}>
            {item.isAdminApproved ? (
              <View style={styles.approvedBadge}>
                <Shield size={14} color={theme.colors.status.success} />
                <Text style={styles.approvedText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.pendingBadge}>
                <Shield size={14} color={theme.colors.status.warning} />
                <Text style={styles.pendingText}>Pending Approval</Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <HomeIcon size={48} color={theme.colors.neutral.gray400} />
      </View>
      <Text style={styles.emptyTitle}>No Apartments Yet</Text>
      <Text style={styles.emptyText}>
        Add your first apartment to get started
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/user/add-apartment')}
      >
        <LinearGradient
          colors={theme.colors.background.gradientPrimary}
          style={styles.addButtonGradient}
        >
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Apartment</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaWrapper>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading apartments...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  const totalApartments = ownedApartments.length + rentedApartments.length;

  return (
    <SafeAreaWrapper>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <View>
          <Text style={styles.greeting}>My Apartments</Text>
          <Text style={styles.subGreeting}>
            {totalApartments === 0
              ? 'Add your first apartment'
              : `${totalApartments} apartment${totalApartments > 1 ? 's' : ''}`}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addIconButton}
          onPress={() => router.push('/user/add-apartment')}
        >
          <LinearGradient
            colors={theme.colors.background.gradientPrimary}
            style={styles.addIconGradient}
          >
            <Plus size={24} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Content */}
      {totalApartments === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={[...ownedApartments, ...rentedApartments]}
          renderItem={renderApartmentCard}
          keyExtractor={(item) => `apt-${item.ownershipId}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary.blue]}
              tintColor={theme.colors.primary.blue}
            />
          }
          ListHeaderComponent={
            <>
              {ownedApartments.length > 0 && (
                <View style={styles.sectionHeader}>
                  <HomeIcon size={20} color={theme.colors.primary.blue} />
                  <Text style={styles.sectionTitle}>Owned Properties</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{ownedApartments.length}</Text>
                  </View>
                </View>
              )}
            </>
          }
          ListFooterComponent={
            <>
              {rentedApartments.length > 0 && (
                <>
                  <View style={[styles.sectionHeader, { marginTop: theme.spacing.xl }]}>
                    <Users size={20} color={theme.colors.primary.purple} />
                    <Text style={styles.sectionTitle}>Rented Properties</Text>
                    <View style={[styles.countBadge, styles.rentedCountBadge]}>
                      <Text style={styles.countText}>{rentedApartments.length}</Text>
                    </View>
                  </View>
                </>
              )}
            </>
          }
        />
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
  },
  greeting: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  subGreeting: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  addIconButton: {
    borderRadius: 12,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  addIconGradient: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.base,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  countBadge: {
    backgroundColor: theme.colors.primaryShades.blue100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rentedCountBadge: {
    backgroundColor: theme.colors.primaryShades.purple100,
  },
  countText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  card: {
    marginBottom: theme.spacing.base,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  cardGradient: {
    borderRadius: theme.borderRadius.card,
  },
  communityImage: {
    width: '100%',
    height: 120,
  },
  communityImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    padding: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentNumber: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  floorText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownerBadge: {
    backgroundColor: theme.colors.status.successLight,
  },
  tenantBadge: {
    backgroundColor: theme.colors.primaryShades.purple100,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.bold,
  },
  ownerBadgeText: {
    color: theme.colors.status.success,
  },
  tenantBadgeText: {
    color: theme.colors.primary.purple,
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  communityName: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
    flex: 1,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  addressText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.status.successLight,
    borderRadius: 8,
  },
  approvedText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.success,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.status.warningLight,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.warning,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxxl,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  emptyText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  addButton: {
    borderRadius: theme.borderRadius.button,
    overflow: 'hidden',
    ...theme.shadows.md,
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  addButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
});