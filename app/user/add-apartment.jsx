// ============================================
// FILE: app/(user)/user/add-apartment.jsx
// Step 1: Select Community
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { API_ENDPOINTS, buildApiUrl } from '@/config/apiConfig';
import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Building2,
    ChevronLeft,
    ChevronRight,
    MapPin,
    Search,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function AddApartmentScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [communities, setCommunities] = useState([]);
  const [filteredCommunities, setFilteredCommunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCommunities(communities);
    } else {
      const filtered = communities.filter(
        (community) =>
          community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          community.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          community.state?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCommunities(filtered);
    }
  }, [searchQuery, communities]);

  const fetchCommunities = async () => {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.USER_COMMUNITIES));
      const data = await response.json();

      if (data.success) {
        setCommunities(data.data.communities || []);
        setFilteredCommunities(data.data.communities || []);
      }
    } catch (err) {
      console.error('Fetch communities error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCommunity = (community) => {
    router.push({
      pathname: '/user/select-apartment',
      params: {
        communityId: community.id,
        communityName: community.name,
      },
    });
  };

  const renderCommunityCard = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.duration(600).delay(index * 50)}
      style={styles.card}
    >
      <TouchableOpacity
        onPress={() => handleSelectCommunity(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            {/* Community Image */}
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.communityImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Building2 size={32} color={theme.colors.neutral.gray400} />
              </View>
            )}

            {/* Community Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.communityName} numberOfLines={2}>
                {item.name}
              </Text>
              <View style={styles.locationRow}>
                <MapPin size={14} color={theme.colors.neutral.gray500} />
                <Text style={styles.locationText} numberOfLines={1}>
                  {item.district && item.state
                    ? `${item.district}, ${item.state}`
                    : item.fullAddress}
                </Text>
              </View>
              {item.pincode && (
                <Text style={styles.pincode}>PIN: {item.pincode}</Text>
              )}
            </View>

            {/* Arrow */}
            <ChevronRight size={24} color={theme.colors.primary.blue} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaWrapper>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select Community</Text>
          <Text style={styles.headerSubtitle}>Step 1 of 3</Text>
        </View>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        entering={FadeInUp.duration(600).delay(200)}
        style={styles.searchContainer}
      >
        <View style={styles.searchInputContainer}>
          <Search size={20} color={theme.colors.neutral.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search communities..."
            placeholderTextColor={theme.colors.neutral.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      {/* Communities List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading communities...</Text>
        </View>
      ) : filteredCommunities.length === 0 ? (
        <View style={styles.emptyState}>
          <Building2 size={48} color={theme.colors.neutral.gray400} />
          <Text style={styles.emptyTitle}>No Communities Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery ? 'Try adjusting your search' : 'No communities available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredCommunities}
          renderItem={renderCommunityCard}
          keyExtractor={(item) => `community-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.base,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray100,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    height: 48,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.base,
    borderRadius: theme.borderRadius.card,
    overflow: 'hidden',
    ...theme.shadows.sm,
  },
  cardGradient: {
    borderRadius: theme.borderRadius.card,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.base,
    gap: theme.spacing.md,
  },
  communityImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  communityName: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    flex: 1,
  },
  pincode: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});