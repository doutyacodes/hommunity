// ============================================
// PAGE: Payment History
// Displays rent payment history with status
// ============================================

import { Toast } from "@/components/RoomsManagementUI/Toast";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit2,
  Filter,
  Plus,
  RefreshCw,
  TrendingUp,
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
  TouchableOpacity,
  View
} from "react-native";

const PaymentHistory = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId || params.id;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  // UI State
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch payments from API
  const fetchPayments = useCallback(async (showLoader = true) => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        setError('Please login to view payments');
        return;
      }

      const params = new URLSearchParams();
      if (selectedFilter !== "all") {
        params.append("filter", selectedFilter);
      }

      const url = `${buildApiUrl(API_ENDPOINTS.RENT_SESSION_PAYMENTS_LIST(sessionId))}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setPayments(data.payments || []);
        setSummary(data.summary || null);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch payments');
      }
    } catch (error) {
      console.error('Fetch payments error:', error);
      setError('Failed to load payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId, selectedFilter]);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPayments(false);
  }, [fetchPayments]);

  // Load data on mount and when filter changes
  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Handle approve payment
  const handleApprovePayment = async (paymentId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to approve', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.RENT_SESSION_PAYMENT_APPROVE(sessionId, paymentId)),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('Payment approved successfully', 'success');
        setDetailsModalVisible(false);
        fetchPayments(false);
      } else {
        showToast(data.error || 'Failed to approve payment', 'error');
      }
    } catch (error) {
      console.error('Approve payment error:', error);
      showToast('Failed to approve payment', 'error');
    }
  };

  // Handle dispute payment
  const handleDisputePayment = async (paymentId, reason) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to dispute', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.RENT_SESSION_PAYMENT_UPDATE(sessionId, paymentId)),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'dispute',
            disputeReason: reason || 'Payment amount is incorrect',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('Payment disputed', 'success');
        setDetailsModalVisible(false);
        fetchPayments(false);
      } else {
        showToast(data.error || 'Failed to dispute payment', 'error');
      }
    } catch (error) {
      console.error('Dispute payment error:', error);
      showToast('Failed to dispute payment', 'error');
    }
  };

  // Handle delete payment
  const handleDeletePayment = async (paymentId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to delete', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.RENT_SESSION_PAYMENT_DELETE(sessionId, paymentId)),
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('Payment deleted', 'success');
        setDetailsModalVisible(false);
        fetchPayments(false);
      } else {
        showToast(data.error || 'Failed to delete payment', 'error');
      }
    } catch (error) {
      console.error('Delete payment error:', error);
      showToast('Failed to delete payment', 'error');
    }
  };

  const getStatusConfig = (status) => {
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
      case "disputed":
        return {
          color: theme.colors.status.error,
          bgColor: theme.colors.status.errorLight,
          label: "Disputed",
          icon: XCircle,
        };
      default:
        return {
          color: theme.colors.neutral.gray500,
          bgColor: theme.colors.neutral.gray100,
          label: "Unknown",
          icon: AlertCircle,
        };
    }
  };

  const calculateTotalPaid = () => {
    return summary?.totalPaid || 0;
  };

  const calculatePending = () => {
    return summary?.pendingAmount || 0;
  };

  const filterPayments = () => {
    if (selectedFilter === "all") return payments;
    return payments.filter((p) => p.approvalStatus === selectedFilter);
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailsModalVisible(true);
  };

  const handleLogPayment = () => {
    router.push("/rent/log-payment");
  };

  const renderPaymentCard = ({ item }) => {
    const statusConfig = getStatusConfig(item.approvalStatus);
    const StatusIcon = statusConfig.icon;

    return (
      <TouchableOpacity
        style={styles.paymentCard}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.paymentHeader}>
          <View style={styles.paymentMonthContainer}>
            <Calendar size={18} color={theme.colors.primary.blue} />
            <Text style={styles.paymentMonth}>
              {item.paymentMonth} {item.paymentYear}
            </Text>
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

        <View style={styles.paymentBody}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Amount Paid</Text>
            <Text style={styles.amountValue}>
              {formatCurrency(item.paymentAmount)}
            </Text>
          </View>

          <View style={styles.paymentMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Logged by</Text>
              <Text style={styles.metaValue}>{item.loggerName}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Date</Text>
              <Text style={styles.metaValue}>
                {formatDate(item.paymentDate)}
              </Text>
            </View>
          </View>

          {item.disputeReason && (
            <View style={styles.disputeAlert}>
              <AlertCircle size={14} color={theme.colors.status.error} />
              <Text style={styles.disputeText}>{item.disputeReason}</Text>
            </View>
          )}

          {item.approvalStatus === "pending" && item.loggedByRole === "tenant" && (
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}>
              <Edit2 size={14} color={theme.colors.primary.blue} />
              <Text style={styles.actionButtonText}>Review & Approve</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading payments...</Text>
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
            onPress={() => fetchPayments()}
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
            <Text style={styles.headerTitle}>Payment History</Text>
            <Text style={styles.headerSubtitle}>
              {payments.length} total payments
            </Text>
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
            activeOpacity={0.7}
          >
            <Filter size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: theme.colors.status.successLight },
              ]}
            >
              <TrendingUp size={20} color={theme.colors.status.success} />
            </View>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(calculateTotalPaid())}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View
              style={[
                styles.summaryIcon,
                { backgroundColor: theme.colors.status.warningLight },
              ]}
            >
              <Clock size={20} color={theme.colors.status.warning} />
            </View>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(calculatePending())}
            </Text>
          </View>
        </View>

        {/* Payments List */}
        <FlatList
          data={filterPayments()}
          renderItem={renderPaymentCard}
          keyExtractor={(item) => `payment-${item.id}`}
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
              <DollarSign size={48} color={theme.colors.neutral.gray400} />
              <Text style={styles.emptyStateText}>No payments found</Text>
              <Text style={styles.emptyStateSubtext}>
                {!sessionId ? 'Please select a rent session' : 'Log a payment to get started'}
              </Text>
            </View>
          }
        />

        {/* Add Payment FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleLogPayment}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Payment Details Modal */}
        <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Payment Details</Text>
                <TouchableOpacity
                  onPress={() => setDetailsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>

              {selectedPayment && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>
                      Payment Information
                    </Text>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Month</Text>
                      <Text style={styles.detailValue}>
                        {selectedPayment.paymentMonth}{" "}
                        {selectedPayment.paymentYear}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total Amount</Text>
                      <Text style={styles.detailValue}>
                        {formatCurrency(selectedPayment.paymentAmount)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment Date</Text>
                      <Text style={styles.detailValue}>
                        {formatDate(selectedPayment.paymentDate)}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Logged By</Text>
                      <Text style={styles.detailValue}>
                        {selectedPayment.loggerName} (
                        {selectedPayment.loggedByRole})
                      </Text>
                    </View>
                  </View>

                  {selectedPayment.approvalStatus !== "pending" && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>
                        Approval Status
                      </Text>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Status</Text>
                        <Text
                          style={[
                            styles.detailValue,
                            {
                              color: getStatusConfig(
                                selectedPayment.approvalStatus
                              ).color,
                            },
                          ]}
                        >
                          {
                            getStatusConfig(selectedPayment.approvalStatus)
                              .label
                          }
                        </Text>
                      </View>
                      {selectedPayment.approvedAt && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Approved At</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(selectedPayment.approvedAt)}
                          </Text>
                        </View>
                      )}
                      {selectedPayment.disputeReason && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Dispute Reason
                          </Text>
                          <Text style={styles.detailValueFull}>
                            {selectedPayment.disputeReason}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Action Buttons */}
                  {selectedPayment && (
                    <View style={styles.modalActions}>
                      {selectedPayment.approvalStatus === "pending" &&
                        selectedPayment.loggedByRole === "tenant" && (
                          <>
                            <TouchableOpacity
                              style={[styles.modalActionButton, styles.approveButton]}
                              onPress={() => handleApprovePayment(selectedPayment.id)}
                              activeOpacity={0.7}
                            >
                              <CheckCircle size={18} color="#FFFFFF" />
                              <Text style={styles.modalActionButtonText}>
                                Approve
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.modalActionButton, styles.disputeButton]}
                              onPress={() => handleDisputePayment(selectedPayment.id)}
                              activeOpacity={0.7}
                            >
                              <XCircle size={18} color="#FFFFFF" />
                              <Text style={styles.modalActionButtonText}>
                                Dispute
                              </Text>
                            </TouchableOpacity>
                          </>
                        )}
                      {selectedPayment.approvalStatus !== "approved" && (
                        <TouchableOpacity
                          style={[styles.modalActionButton, styles.deleteButton]}
                          onPress={() => handleDeletePayment(selectedPayment.id)}
                          activeOpacity={0.7}
                        >
                          <XCircle size={18} color="#FFFFFF" />
                          <Text style={styles.modalActionButtonText}>
                            Delete
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filter Payments</Text>
                <TouchableOpacity
                  onPress={() => setFilterModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>

              {["all", "approved", "pending", "disputed"].map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterOption,
                    selectedFilter === filter && styles.filterOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter);
                    setFilterModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilter === filter &&
                        styles.filterOptionTextSelected,
                    ]}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Text>
                  {selectedFilter === filter && (
                    <CheckCircle size={20} color={theme.colors.primary.blue} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Toast Notification */}
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  summaryContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.massive,
  },
  paymentCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primaryShades.blue50,
  },
  paymentMonthContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  paymentMonth: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
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
  paymentBody: {
    padding: theme.spacing.base,
  },
  amountSection: {
    marginBottom: theme.spacing.md,
  },
  amountLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  paymentMeta: {
    flexDirection: "row",
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  disputeAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.errorLight,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  disputeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.status.error,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue100,
    borderRadius: theme.borderRadius.input,
    paddingVertical: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionButtonText: {
    fontSize: 13,
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
    maxHeight: "80%",
  },
  filterModalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
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
  closeButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  detailSection: {
    marginBottom: theme.spacing.xl,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  detailValueFull: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  filterOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  filterOptionSelected: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  filterOptionText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  filterOptionTextSelected: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
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
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.xl,
  },
  modalActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
  },
  modalActionButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
  },
  approveButton: {
    backgroundColor: theme.colors.status.success,
  },
  disputeButton: {
    backgroundColor: theme.colors.status.warning,
  },
  deleteButton: {
    backgroundColor: theme.colors.status.error,
  },
});

export default PaymentHistory;