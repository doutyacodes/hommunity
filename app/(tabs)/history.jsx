// ============================================
// FILE: app/(tabs)/history.jsx
// Guest History Tab with Filtering
// Shows all past guests (hides private guests from other members)
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthToken } from '@/services/authService';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { buildApiUrl, API_ENDPOINTS, getApiHeaders } from '@/config/apiConfig';
import GuestCard from '@/components/user/GuestCard';
import { useFocusEffect } from 'expo-router';

export default function HistoryTab() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'approved' | 'pending' | 'expired'

  useFocusEffect(
    useCallback(() => {
      loadGuests();
    }, [filter])
  );

  const loadGuests = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);

    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.GUEST_HISTORY}?filter=${filter}`),
        {
          headers: getApiHeaders(token),
        }
      );

      const data = await response.json();

      if (data.success) {
        setGuests(data.guests || []);
      }
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadGuests(true);
  };

  const renderFilterButton = (filterValue, label, icon) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterValue && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterValue)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={18}
        color={
          filter === filterValue ? colors.background.primary : colors.text.tertiary
        }
      />
      <Text
        style={[
          styles.filterButtonText,
          filter === filterValue && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="time-outline" size={64} color={colors.text.disabled} />
      <Text style={styles.emptyStateTitle}>No Guest History</Text>
      <Text style={styles.emptyStateText}>
        Your guest history will appear here once you create guests
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary.blue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Filters */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Guest History</Text>
          <Text style={styles.subtitle}>{guests.length} total guests</Text>
        </View>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', 'list-outline')}
        {renderFilterButton('approved', 'Approved', 'checkmark-circle-outline')}
        {renderFilterButton('pending', 'Pending', 'hourglass-outline')}
        {renderFilterButton('expired', 'Expired', 'close-circle-outline')}
      </View>

      {/* Guest List */}
      <FlatList
        data={guests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <GuestCard
            guest={item}
            onPress={() => console.log('Guest details:', item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary.blue}
            colors={[colors.primary.blue]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
  },
  header: {
    padding: spacing.base,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xxl,
    color: colors.text.primary,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.background.primary,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    gap: spacing.xxs,
  },
  filterButtonActive: {
    backgroundColor: colors.primary.blue,
    borderColor: colors.primary.blue,
  },
  filterButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
  filterButtonTextActive: {
    color: colors.background.primary,
  },
  listContent: {
    padding: spacing.base,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.massive,
  },
  emptyStateTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginTop: spacing.base,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 250,
  },
});
