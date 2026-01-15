import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import theme from "@/theme";
import {
    ActivityIndicator,
    AlertCircle,
    ArrowRight,
    Calendar,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Clock,
    DollarSign,
    Edit2,
    History,
    Package,
    Plus,
    RefreshCw,
    User,
    X,
    XCircle
} from "lucide-react-native";
import { useState, useCallback, useEffect } from "react";
import {
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Toast } from "@/components/RoomsManagementUI/Toast";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";

// ============================================
// MAIN COMPONENT
// ============================================
const RoomAccessoriesUI = () => {
  const params = useLocalSearchParams();
  const roomId = params.roomId || params.id;

  // Data state
  const [accessories, setAccessories] = useState([]);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // UI State
  const [expandedAccessory, setExpandedAccessory] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReplacement, setSelectedReplacement] = useState(null);

  // Add accessory form
  const [accessoryName, setAccessoryName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [quantity, setQuantity] = useState("1");

  // Edit replacement form
  const [editCost, setEditCost] = useState("");
  const [editPaidBy, setEditPaidBy] = useState("tenant");
  const [editIncludedInRent, setEditIncludedInRent] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch accessories and replacement history
  const fetchData = useCallback(async (showLoader = true) => {
    if (!roomId) {
      setError('Room ID is required');
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        setError('Please login to view accessories');
        return;
      }

      // Fetch accessories
      const accessoriesResponse = await fetch(
        buildApiUrl(API_ENDPOINTS.ROOM_ACCESSORIES_LIST(roomId)),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const accessoriesData = await accessoriesResponse.json();

      if (!accessoriesData.success) {
        setError(accessoriesData.error || 'Failed to fetch accessories');
        return;
      }

      // Fetch replacement history
      const historyResponse = await fetch(
        buildApiUrl(API_ENDPOINTS.ROOM_REPLACEMENT_HISTORY(roomId)),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const historyData = await historyResponse.json();

      if (!historyData.success) {
        console.warn('Failed to fetch replacement history:', historyData.error);
      }

      // Merge accessories with their replacement history
      const replacementHistory = historyData.success ? historyData.history || [] : [];
      const accessoriesWithHistory = accessoriesData.accessories.map(acc => ({
        ...acc,
        replacementHistory: replacementHistory.filter(h => h.accessoryId === acc.id)
      }));

      setAccessories(accessoriesWithHistory);
      setRoom(accessoriesData.room);
      setError(null);
    } catch (error) {
      console.error('Fetch data error:', error);
      setError('Failed to load accessories');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [roomId]);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData(false);
  }, [fetchData]);

  // Load data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddAccessory = async () => {
    if (!accessoryName.trim()) {
      showToast("Please enter accessory name", "error");
      return;
    }
    if (!brandName.trim()) {
      showToast("Please enter brand name", "error");
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to add accessory', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.ADD_ROOM_ACCESSORY(roomId)),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            accessoryName: accessoryName.trim(),
            brandName: brandName.trim(),
            quantity: parseInt(quantity) || 1,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        setAccessoryName("");
        setBrandName("");
        setQuantity("1");
        setAddModalVisible(false);
        fetchData(false);
      } else {
        showToast(data.error || 'Failed to add accessory', 'error');
      }
    } catch (error) {
      console.error('Add accessory error:', error);
      showToast('Failed to add accessory', 'error');
    }
  };

  const handleApproveReplacement = async (accessoryId, replacementId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to approve', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.APPROVE_REPLACEMENT(roomId, replacementId)),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'approve',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        fetchData(false);
      } else {
        showToast(data.error || 'Failed to approve replacement', 'error');
      }
    } catch (error) {
      console.error('Approve replacement error:', error);
      showToast('Failed to approve replacement', 'error');
    }
  };

  const handleEditReplacement = (replacement) => {
    setSelectedReplacement(replacement);
    setEditCost(replacement.cost?.toString() || "0");
    setEditPaidBy(replacement.paidBy || "tenant");
    setEditIncludedInRent(replacement.includedInRent || false);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editCost.trim()) {
      showToast("Please enter cost", "error");
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to edit replacement', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.UPDATE_REPLACEMENT(roomId, selectedReplacement.id)),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cost: parseFloat(editCost),
            paidBy: editPaidBy,
            includedInRent: editIncludedInRent,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message, "success");
        setEditModalVisible(false);
        fetchData(false);
      } else {
        showToast(data.error || 'Failed to update replacement', 'error');
      }
    } catch (error) {
      console.error('Update replacement error:', error);
      showToast('Failed to update replacement', 'error');
    }
  };

  const toggleExpand = (id) => {
    setExpandedAccessory(expandedAccessory === id ? null : id);
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

  const renderReplacementHistory = (history) => {
    if (!history || history.length === 0) {
      return (
        <View style={styles.noHistoryContainer}>
          <History size={16} color={theme.colors.neutral.gray400} />
          <Text style={styles.noHistoryText}>No replacement history</Text>
        </View>
      );
    }

    return (
      <View style={styles.historyContainer}>
        <View style={styles.historyHeader}>
          <History size={16} color={theme.colors.primary.blue} />
          <Text style={styles.historyTitle}>Replacement History</Text>
          <View style={styles.historyCountBadge}>
            <Text style={styles.historyCountText}>{history.length}</Text>
          </View>
        </View>

        {history.map((item, index) => {
          const statusBadge = getStatusBadge(item.approvalStatus);
          const StatusIcon = statusBadge.icon;

          return (
            <View key={item.id} style={styles.historyItem}>
              {/* Timeline connector */}
              {index < history.length - 1 && (
                <View style={styles.timelineConnector} />
              )}

              {/* Timeline dot */}
              <View
                style={[
                  styles.timelineDot,
                  { backgroundColor: statusBadge.color },
                ]}
              />

              <View style={styles.historyContent}>
                {/* Brand change */}
                <View style={styles.brandChangeRow}>
                  {item.oldAccessoryName ? (
                    <>
                      <Text style={styles.oldBrand}>{item.oldAccessoryName}</Text>
                      <ArrowRight
                        size={16}
                        color={theme.colors.neutral.gray400}
                      />
                      <Text style={styles.newBrand}>{item.newAccessoryName}</Text>
                    </>
                  ) : (
                    <Text style={styles.newBrand}>{item.newAccessoryName} (New)</Text>
                  )}
                </View>

                {/* Reason */}
                {item.replacementReason && (
                  <Text style={styles.replacementReason}>
                    {item.replacementReason}
                  </Text>
                )}

                {/* Details */}
                <View style={styles.replacementDetails}>
                  {item.cost != null && (
                    <>
                      <View style={styles.detailItem}>
                        <DollarSign
                          size={14}
                          color={theme.colors.neutral.gray500}
                        />
                        <Text style={styles.detailText}>
                          ₹{parseFloat(item.cost).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.detailDivider} />
                    </>
                  )}
                  <View style={styles.detailItem}>
                    <User size={14} color={theme.colors.neutral.gray500} />
                    <Text style={styles.detailText}>Paid by {item.paidBy}</Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailItem}>
                    <Calendar size={14} color={theme.colors.neutral.gray500} />
                    <Text style={styles.detailText}>
                      {new Date(item.replacementDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>

                {/* Status and Actions */}
                <View style={styles.historyActions}>
                  <View
                    style={[
                      styles.historyStatusBadge,
                      { backgroundColor: statusBadge.bgColor },
                    ]}
                  >
                    <StatusIcon size={12} color={statusBadge.color} />
                    <Text
                      style={[
                        styles.historyStatusText,
                        { color: statusBadge.color },
                      ]}
                    >
                      {statusBadge.label}
                    </Text>
                  </View>

                  {item.approvalStatus === "pending" &&
                    item.replacedByRole === "tenant" && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditReplacement(item)}
                        >
                          <Edit2 size={14} color={theme.colors.primary.blue} />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.approveButton}
                          onPress={() => handleApproveReplacement(0, item.id)}
                        >
                          <Check
                            size={14}
                            color={theme.colors.status.success}
                          />
                          <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </View>

                {item.includedInRent && (
                  <View style={styles.rentIncludedBadge}>
                    <Text style={styles.rentIncludedText}>
                      Included in rent
                    </Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAccessoryCard = ({ item }) => {
    const isExpanded = expandedAccessory === item.id;
    const statusBadge = getStatusBadge(item.approvalStatus);
    const StatusIcon = statusBadge.icon;

    return (
      <View style={styles.accessoryCard}>
        <TouchableOpacity
          style={styles.accessoryHeader}
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.accessoryIconContainer}>
            <Package size={24} color={theme.colors.primary.blue} />
          </View>

          <View style={styles.accessoryInfo}>
            <Text style={styles.accessoryName}>{item.accessoryName}</Text>
            <Text style={styles.accessoryBrand}>{item.brandName}</Text>
            <Text style={styles.accessoryQuantity}>Qty: {item.quantity}</Text>
          </View>

          <View style={styles.accessoryHeaderRight}>
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
            {isExpanded ? (
              <ChevronUp size={20} color={theme.colors.neutral.gray500} />
            ) : (
              <ChevronDown size={20} color={theme.colors.neutral.gray500} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.accessoryExpandedContent}>
            <View style={styles.accessoryMeta}>
              <Text style={styles.metaLabel}>Added by:</Text>
              <Text style={styles.metaValue}>{item.createdByRole}</Text>
            </View>
            {renderReplacementHistory(item.replacementHistory)}
          </View>
        )}
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading accessories...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={theme.colors.status.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchData()}
          >
            <RefreshCw size={20} color={theme.colors.primary.blue} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
            <Text style={styles.roomName}>{room?.roomName || "Room"}</Text>
            <Text style={styles.roomSubtitle}>
              {accessories.length} accessor
              {accessories.length !== 1 ? "ies" : "y"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setAddModalVisible(true)}
          >
            <View style={styles.addButtonGradient}>
              <Plus size={24} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Accessories List */}
        <FlatList
          data={accessories}
          renderItem={renderAccessoryCard}
          keyExtractor={(item) => `accessory-${item.id}`}
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
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Package size={48} color={theme.colors.neutral.gray400} />
              <Text style={styles.emptyStateText}>No accessories yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Add accessories to track them
              </Text>
            </View>
          }
        />

        {/* Add Accessory Modal */}
        <Modal
          visible={addModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Accessory</Text>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.neutral.gray700} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Accessory Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Air Conditioner"
                    value={accessoryName}
                    onChangeText={setAccessoryName}
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Brand Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., LG Dual Inverter"
                    value={brandName}
                    onChangeText={setBrandName}
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setAddModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddAccessory}
                  >
                    <View style={styles.submitButtonGradient}>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Add Accessory</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Replacement Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Replacement Details</Text>
                <TouchableOpacity
                  onPress={() => setEditModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.neutral.gray700} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Cost (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter cost"
                    value={editCost}
                    onChangeText={setEditCost}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Paid By *</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        editPaidBy === "tenant" && styles.radioOptionSelected,
                      ]}
                      onPress={() => setEditPaidBy("tenant")}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          editPaidBy === "tenant" && styles.radioCircleSelected,
                        ]}
                      >
                        {editPaidBy === "tenant" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          editPaidBy === "tenant" && styles.radioLabelSelected,
                        ]}
                      >
                        Tenant
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        editPaidBy === "owner" && styles.radioOptionSelected,
                      ]}
                      onPress={() => setEditPaidBy("owner")}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          editPaidBy === "owner" && styles.radioCircleSelected,
                        ]}
                      >
                        {editPaidBy === "owner" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          editPaidBy === "owner" && styles.radioLabelSelected,
                        ]}
                      >
                        Owner
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setEditIncludedInRent(!editIncludedInRent)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      editIncludedInRent && styles.checkboxChecked,
                    ]}
                  >
                    {editIncludedInRent && <Check size={16} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.checkboxLabel}>Included in rent</Text>
                </TouchableOpacity>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSaveEdit}
                  >
                    <View style={styles.submitButtonGradient}>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Save Changes</Text>
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
  roomName: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  roomSubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginTop: 4,
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
  },
  accessoryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.base,
    overflow: "hidden",
    ...theme.shadows.sm,
  },
  accessoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.base,
  },
  accessoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  accessoryInfo: {
    flex: 1,
  },
  accessoryName: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  accessoryBrand: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.primary.blue,
    marginBottom: 2,
  },
  accessoryQuantity: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  accessoryHeaderRight: {
    alignItems: "flex-end",
    gap: theme.spacing.xs,
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
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
  },
  accessoryExpandedContent: {
    paddingHorizontal: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
  },
  accessoryMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  metaLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    textTransform: "capitalize",
  },
  historyContainer: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.neutral.gray50,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.base,
  },
  historyTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  historyCountBadge: {
    backgroundColor: theme.colors.primaryShades.blue100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  historyCountText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  historyItem: {
    position: "relative",
    paddingLeft: theme.spacing.lg,
    marginBottom: theme.spacing.base,
  },
  timelineConnector: {
    position: "absolute",
    left: 7,
    top: 20,
    bottom: -theme.spacing.base,
    width: 2,
    backgroundColor: theme.colors.border.light,
  },
  timelineDot: {
    position: "absolute",
    left: 4,
    top: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  historyContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.md,
    ...theme.shadows.xs,
  },
  brandChangeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    flexWrap: "wrap",
  },
  oldBrand: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    textDecorationLine: "line-through",
  },
  newBrand: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  replacementReason: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
    fontStyle: "italic",
  },
  replacementDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    flexWrap: "wrap",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  detailDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.border.light,
    marginHorizontal: theme.spacing.sm,
  },
  historyActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  historyStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  historyStatusText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
  },
  actionButtons: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  approveButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: theme.colors.status.successLight,
  },
  approveButtonText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.success,
  },
  rentIncludedBadge: {
    marginTop: theme.spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: theme.colors.primaryShades.purple100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rentIncludedText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.purple,
  },
  noHistoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.base,
  },
  noHistoryText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
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
    maxHeight: "85%",
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
  radioGroup: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.input,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.secondary,
  },
  radioOptionSelected: {
    borderColor: theme.colors.primary.blue,
    backgroundColor: theme.colors.primaryShades.blue100,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  radioCircleSelected: {
    borderColor: theme.colors.primary.blue,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary.blue,
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  radioLabelSelected: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary.blue,
    borderColor: theme.colors.primary.blue,
  },
  checkboxLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    // flex: 1,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
  },
  errorText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
    textAlign: "center",
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue100,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
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
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
});
export default RoomAccessoriesUI;
