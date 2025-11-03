// ============================================
// FILE: app/(tabs)/active.jsx
// Active Guests Tab - Frequent Guests Management
// Activate/Deactivate, Delete, Show QR
// ============================================

import GuestCard from "@/components/user/GuestCard";
import QRCodeDisplay from "@/components/user/QRCodeDisplay";
import { API_ENDPOINTS, buildApiUrl, getApiHeaders } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import { borderRadius, colors, spacing, typography } from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ActiveTab() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [currentApartment, setCurrentApartment] = useState(null);

  useFocusEffect(
    useCallback(() => {
      loadActiveGuests();
      loadCurrentApartment();
    }, [])
  );

  const loadCurrentApartment = async () => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.GET_CURRENT_APARTMENT),
        {
          method: "POST", // 👈 IMPORTANT
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }), // 👈 send token in body
        }
      );
      const data = await response.json();
      if (data.success) {
        setCurrentApartment(data.apartment);
      }
    } catch (error) {
      console.error("Error loading apartment:", error);
    }
  };

  const loadActiveGuests = async (isRefreshing = false) => {
    if (!isRefreshing) setLoading(true);

    try {
      const token = await getAuthToken();
      const response = await fetch(buildApiUrl(API_ENDPOINTS.ACTIVE_GUESTS), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setGuests(data.guests || []);
      }
    } catch (error) {
      console.error("Error loading active guests:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadActiveGuests(true);
  };

  const handleToggleActive = async (guest) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(
        buildApiUrl(`${API_ENDPOINTS.TOGGLE_GUEST_ACTIVE}/${guest.id}`),
        {
          method: "PATCH",
          headers: getApiHeaders(token),
          body: JSON.stringify({ isActive: !guest.isActive }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Update local state
        setGuests((prev) =>
          prev.map((g) =>
            g.id === guest.id ? { ...g, isActive: !g.isActive } : g
          )
        );
        Alert.alert(
          "Success",
          `Guest ${!guest.isActive ? "activated" : "deactivated"} successfully`
        );
      } else {
        Alert.alert("Error", data.message || "Failed to update guest status");
      }
    } catch (error) {
      console.error("Toggle active error:", error);
      Alert.alert("Error", "Failed to update guest status");
    }
  };

  const handleDelete = async (guest) => {
    Alert.alert(
      "Delete Guest",
      `Are you sure you want to delete ${guest.guestName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch(
                buildApiUrl(`${API_ENDPOINTS.DELETE_GUEST}/${guest.id}`),
                {
                  method: "DELETE",
                  headers: getApiHeaders(token),
                }
              );

              const data = await response.json();

              if (data.success) {
                setGuests((prev) => prev.filter((g) => g.id !== guest.id));
                Alert.alert("Success", "Guest deleted successfully");
              } else {
                Alert.alert("Error", data.message || "Failed to delete guest");
              }
            } catch (error) {
              console.error("Delete guest error:", error);
              Alert.alert("Error", "Failed to delete guest");
            }
          },
        },
      ]
    );
  };

  const handleShowQR = (guest) => {
    setSelectedGuest(guest);
    setShowQRModal(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={colors.text.disabled} />
      <Text style={styles.emptyStateTitle}>No Active Guests</Text>
      <Text style={styles.emptyStateText}>
        Create frequent guests to see them here. You can activate/deactivate
        them anytime.
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
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Active Guests</Text>
          <Text style={styles.subtitle}>
            {guests.filter((g) => g.isActive).length} active •{" "}
            {guests.filter((g) => !g.isActive).length} inactive
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons
              name="checkmark-circle"
              size={20}
              color={colors.status.success}
            />
            <Text style={styles.statValue}>
              {guests.filter((g) => g.isActive).length}
            </Text>
          </View>
        </View>
      </View>

      {/* Guest List */}
      <FlatList
        data={guests}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <GuestCard
            guest={item}
            showActions
            onToggleActive={() => handleToggleActive(item)}
            onDelete={() => handleDelete(item)}
            onShowQR={() => handleShowQR(item)}
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

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guest QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {selectedGuest && currentApartment && (
              <QRCodeDisplay
                guestData={{
                  ...selectedGuest,
                  apartmentNumber: currentApartment.apartmentNumber,
                  towerName: currentApartment.towerName,
                }}
                encryptedData={selectedGuest.qrEncryptedData}
                size={220}
              />
            )}
          </View>
        </View>
      </Modal>
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
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  statsContainer: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statItem: {
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.xxs,
  },
  statValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
  },
  listContent: {
    padding: spacing.base,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
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
    textAlign: "center",
    maxWidth: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.huge,
    paddingHorizontal: spacing.base,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
    color: colors.text.primary,
  },
});
