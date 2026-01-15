import { Toast } from "@/components/RoomsManagementUI/Toast";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { API_ENDPOINTS, buildApiUrl, PHOTO_CONFIG } from "@/config/apiConfig";
import { useApartment } from "@/providers/ApartmentProvider";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  Home,
  Image as ImageIcon,
  MessageSquare,
  Plus,
  RefreshCw,
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

const DisputesList = () => {
  const router = useRouter();
  const { currentApartment, isApartmentAvailable } = useApartment(); // FIX: Use apartment context

  // Disputes state
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // User state
  const [userRole, setUserRole] = useState(null);
  const [hasApartment, setHasApartment] = useState(true);
  const [hasActiveSession, setHasActiveSession] = useState(true);

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Create dispute modal
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [reportType, setReportType] = useState("common");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [reason, setReason] = useState("");
  const [disputeImage, setDisputeImage] = useState(null);
  const [roomModalVisible, setRoomModalVisible] = useState(false);
  const [submittingDispute, setSubmittingDispute] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch disputes
  const fetchDisputes = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to view disputes", "error");
        return;
      }

      // FIX: Use proper endpoint without fallback
      const response = await fetch(buildApiUrl(API_ENDPOINTS.DISPUTES), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("📥 Disputes response:", data);

      if (!response.ok || !data.success) {
        showToast(data.error || "Failed to load disputes", "error");
        setDisputes([]);
        return;
      }

      // Handle special cases
      if (data.message === "No apartment assigned to this user") {
        setHasApartment(false);
        setHasActiveSession(false);
        setDisputes([]);
        return;
      }

      if (data.message === "No active rent session found") {
        setHasApartment(data.hasApartment !== false);
        setHasActiveSession(false);
        setDisputes([]);
        return;
      }

      // Format image URLs
      const formattedDisputes = data.data.map((dispute) => ({
        ...dispute,
        imageFilename: dispute.imageFilename
          ? dispute.imageFilename.startsWith("http")
            ? dispute.imageFilename
            : `${PHOTO_CONFIG.BASE_URL}${dispute.imageFilename}`
          : null,
      }));

      setDisputes(formattedDisputes);
      setUserRole(data.userRole);
      setHasApartment(data.hasApartment !== false);
      setHasActiveSession(data.hasActiveSession !== false);
    } catch (error) {
      console.error("❌ Error fetching disputes:", error);
      showToast("Failed to load disputes", "error");
      setDisputes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // FIX: Fetch rooms with apartmentId
  const fetchRooms = async () => {
    if (!currentApartment?.apartmentId) {
      showToast("No apartment selected", "error");
      return;
    }

    try {
      setLoadingRooms(true);

      const token = await getAuthToken();
      if (!token) return;

      // FIX: Add apartmentId query parameter
      const url = `${buildApiUrl(API_ENDPOINTS.ROOMS_LIST)}?apartmentId=${currentApartment.apartmentId}`;
      
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      console.log("📥 Rooms response:", data);

      if (response.ok && data.success) {
        // FIX: Only show approved rooms for disputes
        const approvedRooms = (data.rooms || []).filter(
          room => room.approvalStatus === 'approved'
        );
        setRooms(approvedRooms);
      } else {
        showToast("Failed to load rooms", "error");
      }
    } catch (error) {
      console.error("❌ Error fetching rooms:", error);
      showToast("Failed to load rooms", "error");
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isApartmentAvailable) {
      fetchDisputes();
    }
  }, [isApartmentAvailable, fetchDisputes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDisputes(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Permission to access gallery denied", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDisputeImage(result.assets[0].uri);
      showToast("Image selected", "success");
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showToast("Permission to access camera denied", "error");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDisputeImage(result.assets[0].uri);
      showToast("Photo captured", "success");
    }
  };

  const handleOpenCreateModal = async () => {
    setCreateModalVisible(true);
    await fetchRooms();
  };

  const handleCreateDispute = async () => {
    try {
      // Validation
      if (!reason.trim()) {
        showToast("Please enter a reason", "error");
        return;
      }

      if (reportType === "room_based" && !selectedRoom) {
        showToast("Please select a room", "error");
        return;
      }

      setSubmittingDispute(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login", "error");
        return;
      }

      let imageFilename = null;

      // Upload image if present
      if (disputeImage) {
        const formData = new FormData();
        formData.append("guestImage", {
          uri: disputeImage,
          name: `dispute_${Date.now()}.jpg`,
          type: "image/jpeg",
        });

        const uploadRes = await fetch(PHOTO_CONFIG.UPLOAD_URL, {
          method: "POST",
          body: formData,
        });

        const uploadJson = await uploadRes.json();
        if (uploadJson.success && uploadJson.uploadedFiles?.length > 0) {
          imageFilename = uploadJson.uploadedFiles[0];
        } else {
          showToast("Image upload failed", "error");
          setSubmittingDispute(false);
          return;
        }
      }

      // Create dispute
      const payload = {
        reportType,
        reason: reason.trim(),
        roomId: reportType === "room_based" ? selectedRoom?.id : null,
        imageFilename,
      };

      console.log("📤 Creating dispute:", payload);

      const response = await fetch(buildApiUrl(API_ENDPOINTS.CREATE_DISPUTE), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📥 Create dispute response:", data);

      if (!response.ok || !data.success) {
        showToast(data.error || "Failed to create dispute", "error");
        return;
      }

      showToast("Dispute created successfully", "success");
      setCreateModalVisible(false);
      setReason("");
      setSelectedRoom(null);
      setDisputeImage(null);
      setReportType("common");

      // Refresh disputes list
      await fetchDisputes(false);
    } catch (error) {
      console.error("❌ Error creating dispute:", error);
      showToast("Something went wrong", "error");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "open":
        return {
          color: theme.colors.status.info,
          bgColor: theme.colors.status.infoLight,
          label: "Open",
          icon: AlertCircle,
        };
      case "in_progress":
        return {
          color: theme.colors.status.warning,
          bgColor: theme.colors.status.warningLight,
          label: "In Progress",
          icon: Clock,
        };
      case "escalated":
        return {
          color: theme.colors.status.error,
          bgColor: theme.colors.status.errorLight,
          label: "Escalated",
          icon: AlertCircle,
        };
      case "resolved":
        return {
          color: theme.colors.status.success,
          bgColor: theme.colors.status.successLight,
          label: "Resolved",
          icon: CheckCircle,
        };
      default:
        return {
          color: theme.colors.neutral.gray500,
          bgColor: theme.colors.neutral.gray100,
          label: "Unknown",
          icon: XCircle,
        };
    }
  };

  const filterDisputes = () => {
    if (selectedFilter === "all") return disputes;
    return disputes.filter((d) => d.status === selectedFilter);
  };

  const handleDisputePress = (dispute) => {
    router.push(`/user/rent/dispute-chat/${dispute.id}`);
  };

  const renderDisputeCard = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    const StatusIcon = statusConfig.icon;

    return (
      <TouchableOpacity
        style={styles.disputeCard}
        onPress={() => handleDisputePress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.disputeHeader}>
          <View style={styles.disputeTypeContainer}>
            <View
              style={[
                styles.disputeIcon,
                {
                  backgroundColor:
                    item.reportType === "room_based"
                      ? theme.colors.primaryShades.blue100
                      : theme.colors.primaryShades.purple100,
                },
              ]}
            >
              {item.reportType === "room_based" ? (
                <Home size={18} color={theme.colors.primary.blue} />
              ) : (
                <MessageSquare size={18} color={theme.colors.primary.purple} />
              )}
            </View>
            <View style={styles.disputeTypeInfo}>
              <Text style={styles.disputeType}>
                {item.reportType === "room_based" ? "Room Issue" : "General"}
              </Text>
              {item.roomName && (
                <Text style={styles.roomName}>{item.roomName}</Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <StatusIcon size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <Text style={styles.disputeReason} numberOfLines={2}>
          {item.reason}
        </Text>

        {item.imageFilename && (
          <Image
            source={{ uri: item.imageFilename }}
            style={styles.disputeImage}
            contentFit="cover"
          />
        )}

        <View style={styles.disputeFooter}>
          <View style={styles.disputeMeta}>
            <Text style={styles.metaText}>
              By {item.reportedByName} ({item.reportedByRole}) •{" "}
              {formatDate(item.createdAt)}
            </Text>
          </View>

          <View style={styles.disputeActions}>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
            <ChevronRight size={20} color={theme.colors.text.tertiary} />
          </View>
        </View>

        {item.escalatedToAdmin && (
          <View style={styles.escalatedBanner}>
            <AlertCircle size={14} color={theme.colors.status.error} />
            <Text style={styles.escalatedText}>
              Escalated to Admin on {formatDate(item.escalatedAt)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Disputes</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.blue} />
            <Text style={styles.loadingText}>Loading disputes...</Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  // No apartment state
  if (!hasApartment) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Disputes</Text>
          </View>
          <View style={styles.emptyStateContainer}>
            <Home size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No Apartment Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              You need to have an approved apartment to access disputes.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => router.push("/user/apartments")}
              activeOpacity={0.7}
            >
              <Text style={styles.emptyStateButtonText}>Add Apartment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  // No active session state
  if (!hasActiveSession) {
    return (
      <SafeAreaWrapper>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Disputes</Text>
          </View>
          <View style={styles.emptyStateContainer}>
            <MessageSquare size={64} color={theme.colors.text.tertiary} />
            <Text style={styles.emptyStateTitle}>No Active Rent Session</Text>
            <Text style={styles.emptyStateSubtitle}>
              You need an active rental agreement to create or view disputes.
            </Text>
          </View>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Disputes</Text>
            <Text style={styles.headerSubtitle}>
              {disputes.length} total • You are {userRole}
            </Text>
          </View>
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <RefreshCw size={20} color={theme.colors.primary.blue} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {["all", "open", "in_progress", "escalated", "resolved"].map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.filterTabActive,
                ]}
                onPress={() => setSelectedFilter(filter)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter && styles.filterTabTextActive,
                  ]}
                >
                  {filter.charAt(0).toUpperCase() +
                    filter.slice(1).replace("_", " ")}
                </Text>
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* Disputes List */}
        <FlatList
          data={filterDisputes()}
          renderItem={renderDisputeCard}
          keyExtractor={(item) => `dispute-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MessageSquare size={48} color={theme.colors.neutral.gray400} />
              <Text style={styles.emptyStateText}>No disputes found</Text>
            </View>
          }
        />

        {/* Create Dispute FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleOpenCreateModal}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Create Dispute Modal */}
        <Modal
          visible={createModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setCreateModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Dispute</Text>
                <TouchableOpacity
                  onPress={() => setCreateModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Report Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Dispute Type *</Text>
                  <View style={styles.reportTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.reportTypeOption,
                        reportType === "room_based" &&
                          styles.reportTypeOptionActive,
                      ]}
                      onPress={() => {
                        setReportType("room_based");
                        setSelectedRoom(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Home
                        size={20}
                        color={
                          reportType === "room_based"
                            ? theme.colors.primary.blue
                            : theme.colors.text.tertiary
                        }
                      />
                      <Text
                        style={[
                          styles.reportTypeText,
                          reportType === "room_based" &&
                            styles.reportTypeTextActive,
                        ]}
                      >
                        Room Based
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.reportTypeOption,
                        reportType === "common" &&
                          styles.reportTypeOptionActive,
                      ]}
                      onPress={() => {
                        setReportType("common");
                        setSelectedRoom(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <MessageSquare
                        size={20}
                        color={
                          reportType === "common"
                            ? theme.colors.primary.blue
                            : theme.colors.text.tertiary
                        }
                      />
                      <Text
                        style={[
                          styles.reportTypeText,
                          reportType === "common" &&
                            styles.reportTypeTextActive,
                        ]}
                      >
                        General
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Room Selection (if room_based) */}
                {reportType === "room_based" && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Select Room *</Text>
                    {loadingRooms ? (
                      <View style={styles.roomLoadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={theme.colors.primary.blue}
                        />
                        <Text style={styles.roomLoadingText}>
                          Loading rooms...
                        </Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.roomSelectButton}
                        onPress={() => setRoomModalVisible(true)}
                        activeOpacity={0.7}
                      >
                        <Home size={20} color={theme.colors.text.tertiary} />
                        <Text
                          style={[
                            styles.roomSelectText,
                            !selectedRoom && styles.roomSelectPlaceholder,
                          ]}
                        >
                          {selectedRoom
                            ? selectedRoom.roomName
                            : "Choose a room"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Reason */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Describe the Issue *</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Explain the issue in detail..."
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholderTextColor={theme.colors.text.placeholder}
                    editable={!submittingDispute}
                  />
                </View>

                {/* Image */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Add Photo (Optional)</Text>

                  {disputeImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: disputeImage }}
                        style={styles.imagePreview}
                        contentFit="cover"
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setDisputeImage(null)}
                        disabled={submittingDispute}
                      >
                        <X size={20} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imagePickerContainer}>
                      <TouchableOpacity
                        style={styles.imagePickerButton}
                        onPress={handlePickImage}
                        activeOpacity={0.7}
                        disabled={submittingDispute}
                      >
                        <ImageIcon
                          size={24}
                          color={theme.colors.primary.blue}
                        />
                        <Text style={styles.imagePickerText}>
                          Choose from Gallery
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.imagePickerButton}
                        onPress={handleTakePhoto}
                        activeOpacity={0.7}
                        disabled={submittingDispute}
                      >
                        <ImageIcon
                          size={24}
                          color={theme.colors.primary.blue}
                        />
                        <Text style={styles.imagePickerText}>Take Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submittingDispute && styles.submitButtonDisabled,
                  ]}
                  onPress={handleCreateDispute}
                  disabled={submittingDispute}
                  activeOpacity={0.7}
                >
                  {submittingDispute ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <MessageSquare size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>
                        Create Dispute
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Room Selection Modal */}
        <Modal
          visible={roomModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setRoomModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.roomModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Room</Text>
                <TouchableOpacity
                  onPress={() => setRoomModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {rooms.length === 0 ? (
                  <View style={styles.noRoomsContainer}>
                    <Home size={48} color={theme.colors.text.tertiary} />
                    <Text style={styles.noRoomsText}>
                      No approved rooms found. Please add rooms first.
                    </Text>
                  </View>
                ) : (
                  rooms.map((room) => (
                    <TouchableOpacity
                      key={room.id}
                      style={[
                        styles.roomOption,
                        selectedRoom?.id === room.id &&
                          styles.roomOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedRoom(room);
                        setRoomModalVisible(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Home size={20} color={theme.colors.primary.blue} />
                      <Text style={styles.roomOptionText}>
                        {room.roomName}
                      </Text>
                      {selectedRoom?.id === room.id && (
                        <CheckCircle
                          size={20}
                          color={theme.colors.primary.blue}
                        />
                      )}
                    </TouchableOpacity>
                  ))
                )}
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
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
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
    marginTop: 2,
  },
  refreshButton: {
    padding: theme.spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  emptyStateButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.button,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  filterContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterTab: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    height: 32,
  },
  filterTabActive: {
    backgroundColor: theme.colors.primary.blue,
    borderColor: theme.colors.primary.blue,
  },
  filterTabText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  filterTabTextActive: {
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.massive,
  },
  disputeCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  disputeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.md,
  },
  disputeTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  disputeIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  disputeTypeInfo: {
    flex: 1,
  },
  disputeType: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  roomName: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
  },
  disputeReason: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    lineHeight: 22,
    marginBottom: theme.spacing.md,
  },
  disputeImage: {
    width: "100%",
    height: 200,
    borderRadius: theme.borderRadius.input,
    marginBottom: theme.spacing.md,
  },
  disputeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  disputeMeta: {
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  disputeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  unreadBadge: {
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  escalatedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.errorLight,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  escalatedText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.status.error,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.giant,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.md,
  },
  fab: {
    position: "absolute",
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: "90%",
  },
  roomModalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: "70%",
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
  inputGroup: {
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  reportTypeContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  reportTypeOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  reportTypeOptionActive: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  reportTypeText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  reportTypeTextActive: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  roomLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  roomLoadingText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  roomSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
  },
  roomSelectText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  roomSelectPlaceholder: {
    color: theme.colors.text.placeholder,
  },
  textArea: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    minHeight: 120,
  },
  imagePickerContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  imagePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
    borderStyle: "dashed",
  },
  imagePickerText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: theme.borderRadius.input,
  },
  removeImageButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.error,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  roomOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  roomOptionSelected: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  roomOptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  noRoomsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  noRoomsText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
});

export default DisputesList;