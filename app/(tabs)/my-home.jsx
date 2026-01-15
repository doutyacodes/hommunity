import { Toast } from "@/components/RoomsManagementUI/Toast";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { useApartment } from "@/providers/ApartmentProvider";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import {
  Bath,
  Bed,
  Check,
  CheckCircle,
  Clock,
  DoorOpen,
  Home,
  Plus,
  Sofa,
  Utensils,
  X,
  XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// ============================================
// ROOM TYPES CONFIGURATION
// ============================================
const ROOM_TYPES = [
  { value: "bedroom", label: "Bedroom", icon: Bed },
  { value: "bathroom", label: "Bathroom", icon: Bath },
  { value: "kitchen", label: "Kitchen", icon: Utensils },
  { value: "living", label: "Living Room", icon: Sofa },
  { value: "other", label: "Other", icon: Home },
];

// ============================================
// MAIN COMPONENT
// ============================================
const RoomsManagementUI = () => {
  const { currentApartment, isApartmentAvailable } = useApartment();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("");

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // ============================================
  // FETCH ROOMS
  // ============================================
  const fetchRooms = useCallback(async () => {
    if (!currentApartment?.apartmentId) {
      setLoading(false);
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("Authentication required", "error");
        return;
      }

      const url = `${buildApiUrl(API_ENDPOINTS.ROOMS_LIST)}?apartmentId=${
        currentApartment.apartmentId
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setRooms(data.rooms || []);
        setUserRole(data.userRole);
        setHasActiveSession(data.hasActiveSession);
      } else {
        showToast(data.message || "Failed to fetch rooms", "error");
      }
    } catch (error) {
      console.error("❌ Error fetching rooms:", error);
      showToast("Failed to load rooms", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentApartment?.apartmentId]);

  useEffect(() => {
    if (isApartmentAvailable) {
      fetchRooms();
    }
  }, [isApartmentAvailable, fetchRooms]);

  // ============================================
  // REFRESH HANDLER
  // ============================================
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRooms();
  }, [fetchRooms]);

  // ============================================
  // ADD ROOM HANDLER
  // ============================================
  const handleAddRoom = async () => {
    if (!roomName.trim()) {
      showToast("Please enter room name", "error");
      return;
    }
    if (!selectedRoomType) {
      showToast("Please select room type", "error");
      return;
    }

    if (!currentApartment?.apartmentId) {
      showToast("No apartment selected", "error");
      return;
    }

    try {
      setSubmitting(true);
      const token = await getAuthToken();

      if (!token) {
        showToast("Authentication required", "error");
        return;
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.CREATE_ROOM), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apartmentId: currentApartment.apartmentId,
          roomName: roomName.trim(),
          roomType: selectedRoomType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        setRoomName("");
        setSelectedRoomType("");
        setModalVisible(false);

        // Refresh rooms list
        await fetchRooms();
      } else {
        showToast(data.message || "Failed to create room", "error");
      }
    } catch (error) {
      console.error("❌ Error creating room:", error);
      showToast("Failed to create room", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getRoomIcon = (type) => {
    const roomType = ROOM_TYPES.find((rt) => rt.value === type);
    return roomType ? roomType.icon : DoorOpen;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return {
          color: theme.colors.status.success,
          bgColor: theme.colors.status.successLight,
          label: "Approved",
          icon: CheckCircle,
        };
      case "pending":
        return {
          color: theme.colors.status.warning,
          bgColor: theme.colors.status.warningLight,
          label: "Pending",
          icon: Clock,
        };
      case "rejected":
        return {
          color: theme.colors.status.error,
          bgColor: theme.colors.status.errorLight,
          label: "Rejected",
          icon: XCircle,
        };
      default:
        return {
          color: theme.colors.neutral.gray500,
          bgColor: theme.colors.neutral.gray100,
          label: "Unknown",
          icon: Clock,
        };
    }
  };

  // ============================================
  // RENDER ROOM CARD
  // ============================================
  const renderRoomCard = ({ item }) => {
    const RoomIcon = getRoomIcon(item.roomType);
    const statusBadge = getStatusBadge(item.approvalStatus);
    const StatusIcon = statusBadge.icon;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.roomIconContainer}>
            <RoomIcon size={24} color={theme.colors.primary.blue} />
          </View>
          <View style={styles.roomInfo}>
            <Text style={styles.roomName}>{item.roomName}</Text>
            <Text style={styles.roomType}>
              {ROOM_TYPES.find((rt) => rt.value === item.roomType)?.label ||
                "Room"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusBadge.bgColor },
            ]}
          >
            <StatusIcon size={12} color={statusBadge.color} />
            <Text style={[styles.statusText, { color: statusBadge.color }]}>
              {statusBadge.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Created by</Text>
            <Text style={styles.infoValue}>{item.createdByRole}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Accessories</Text>
            <Text style={styles.infoValue}>{item.accessoriesCount}</Text>
          </View>
        </View>
      </View>
    );
  };

  // ============================================
  // RENDER EMPTY STATE
  // ============================================
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <DoorOpen size={48} color={theme.colors.neutral.gray400} />
      </View>
      <Text style={styles.emptyTitle}>No Rooms Yet</Text>
      <Text style={styles.emptyText}>
        {isApartmentAvailable
          ? "Add your first room to get started"
          : "Please select an apartment first"}
      </Text>
    </View>
  );

  // ============================================
  // RENDER LOADING STATE
  // ============================================
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
        <Text style={styles.loadingText}>Loading rooms...</Text>
      </View>
    );
  }

  // ============================================
  // NO APARTMENT SELECTED
  // ============================================
  if (!isApartmentAvailable) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Home size={48} color={theme.colors.neutral.gray400} />
          </View>
          <Text style={styles.emptyTitle}>No Apartment Selected</Text>
          <Text style={styles.emptyText}>
            Please select an apartment to view rooms
          </Text>
        </View>
      </View>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Room Management</Text>
          <Text style={styles.headerSubtitle}>
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} in apartment
          </Text>
          {userRole && (
            <Text style={styles.roleText}>
              Role: {userRole === "owner" ? "👑 Owner" : "👤 Tenant"}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          disabled={!isApartmentAvailable}
        >
          <View style={styles.addButtonGradient}>
            <Plus size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => `room-${item.id}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary.blue}
            colors={[theme.colors.primary.blue]}
          />
        }
      />

      {/* ADD ROOM MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Room</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                disabled={submitting}
              >
                <X size={24} color={theme.colors.neutral.gray700} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {hasActiveSession && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxText}>
                    {userRole === "owner"
                      ? "⚠️ Room will need tenant approval"
                      : "⚠️ Room will need owner approval"}
                  </Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Master Bedroom"
                  value={roomName}
                  onChangeText={setRoomName}
                  placeholderTextColor={theme.colors.neutral.gray400}
                  editable={!submitting}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Room Type *</Text>
                <View style={styles.roomTypeGrid}>
                  {ROOM_TYPES.map((type) => {
                    const TypeIcon = type.icon;
                    const isSelected = selectedRoomType === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[
                          styles.roomTypeCard,
                          isSelected && styles.roomTypeCardSelected,
                        ]}
                        onPress={() =>
                          !submitting && setSelectedRoomType(type.value)
                        }
                        disabled={submitting}
                      >
                        <TypeIcon
                          size={24}
                          color={
                            isSelected
                              ? theme.colors.primary.blue
                              : theme.colors.neutral.gray500
                          }
                        />
                        <Text
                          style={[
                            styles.roomTypeLabel,
                            isSelected && styles.roomTypeLabelSelected,
                          ]}
                        >
                          {type.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setModalVisible(false)}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submitting && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAddRoom}
                  disabled={submitting}
                >
                  <View style={styles.submitButtonGradient}>
                    {submitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Check size={20} color="#FFFFFF" />
                        <Text style={styles.submitButtonText}>Add Room</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  roleText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.primary.blue,
    marginTop: 2,
  },
  addButton: {
    borderRadius: 12,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary.blue,
  },
  listContent: {
    padding: theme.spacing.lg,
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  roomType: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    textTransform: "capitalize",
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.base,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxxl * 2,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  infoBox: {
    backgroundColor: theme.colors.status.warningLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  infoBoxText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.status.warning,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  roomTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  roomTypeCard: {
    width: "47%",
    aspectRatio: 1.5,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  roomTypeCardSelected: {
    backgroundColor: theme.colors.primaryShades.blue100,
    borderColor: theme.colors.primary.blue,
  },
  roomTypeLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
    textAlign: "center",
  },
  roomTypeLabelSelected: {
    color: theme.colors.primary.blue,
    fontFamily: theme.typography.fonts.semiBold,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.button,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  submitButton: {
    flex: 1,
    borderRadius: theme.borderRadius.button,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary.blue,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
});

export default RoomsManagementUI;
