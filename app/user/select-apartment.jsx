// ============================================
// FILE: app/(user)/user/select-apartment.jsx
// Step 2: Select Apartment from Community
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { buildApiUrl } from '@/config/apiConfig';
import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    Building2,
    ChevronLeft,
    Home,
    Layers,
    Search
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function SelectApartmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { communityId, communityName } = params;

  const [loading, setLoading] = useState(true);
  const [apartments, setApartments] = useState([]);
  const [filteredApartments, setFilteredApartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (communityId) {
      fetchApartments();
    }
  }, [communityId]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredApartments(apartments);
    } else {
      const filtered = apartments.filter(
        (apt) =>
          apt.apartmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.towerName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredApartments(filtered);
    }
  }, [searchQuery, apartments]);

  const fetchApartments = async () => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/mobile-api/user/communities/${communityId}/apartments`)
      );
      const data = await response.json();

      if (data.success) {
        setApartments(data.data.apartments || []);
        setFilteredApartments(data.data.apartments || []);
      }
    } catch (err) {
      console.error('Fetch apartments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApartment = (apartment) => {
    router.push({
      pathname: '/user/apartment-request-form',
      params: {
        communityId,
        communityName,
        apartmentId: apartment.id,
        apartmentNumber: apartment.apartmentNumber,
        towerName: apartment.towerName || '',
        floorNumber: apartment.floorNumber || '',
      },
    });
  };

  const renderApartmentCard = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.duration(600).delay(index * 30)}
      style={styles.card}
    >
      <TouchableOpacity
        onPress={() => handleSelectApartment(item)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F9FAFB']}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <View style={styles.iconContainer}>
              <Home size={24} color={theme.colors.primary.blue} />
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.apartmentNumber}>{item.apartmentNumber}</Text>
              <View style={styles.detailsRow}>
                {item.towerName && (
                  <View style={styles.detailItem}>
                    <Building2 size={14} color={theme.colors.neutral.gray500} />
                    <Text style={styles.detailText}>{item.towerName}</Text>
                  </View>
                )}
                {item.floorNumber && (
                  <View style={styles.detailItem}>
                    <Layers size={14} color={theme.colors.neutral.gray500} />
                    <Text style={styles.detailText}>Floor {item.floorNumber}</Text>
                  </View>
                )}
              </View>
            </View>
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
          <Text style={styles.headerTitle}>Select Apartment</Text>
          <Text style={styles.headerSubtitle}>{communityName}</Text>
          <Text style={styles.stepText}>Step 2 of 3</Text>
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
            placeholder="Search apartments..."
            placeholderTextColor={theme.colors.neutral.gray400}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      {/* Apartments List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading apartments...</Text>
        </View>
      ) : filteredApartments.length === 0 ? (
        <View style={styles.emptyState}>
          <Home size={48} color={theme.colors.neutral.gray400} />
          <Text style={styles.emptyTitle}>No Apartments Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'No apartments available in this community'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredApartments}
          renderItem={renderApartmentCard}
          keyExtractor={(item) => `apt-${item.id}`}
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
    alignItems: 'flex-start',
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
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.primary.blue,
    marginTop: 2,
  },
  stepText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
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
    marginBottom: theme.spacing.sm,
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  apartmentNumber: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
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