// ============================================
// PAGE: Rent Session Details
// Displays current rent session information
// ============================================

import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    ActivityIndicator,
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit2,
    FileText,
    Home,
    MessageSquare,
    Package,
    RefreshCw,
    TrendingUp,
    User,
    XCircle,
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const RentSessionDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId || params.id;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionData, setSessionData] = useState(null);
  const [error, setError] = useState(null);

  // Fetch session details
  const fetchSessionDetails = useCallback(async (showLoader = true) => {
    if (!sessionId) {
      setError('Session ID is required');
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        setError('Please login to view session details');
        return;
      }

      const url = buildApiUrl(API_ENDPOINTS.RENT_SESSION_DETAILS(sessionId));

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSessionData(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch session details');
      }
    } catch (error) {
      console.error('Fetch session details error:', error);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessionDetails(false);
  }, [fetchSessionDetails]);

  // Load data on mount
  useEffect(() => {
    fetchSessionDetails();
  }, [fetchSessionDetails]);

  const handleNavigate = (route) => {
    router.push(route);
  };

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

  const calculateProgress = () => {
    if (!sessionData?.session) return 0;
    return sessionData.session.progressPercentage || 0;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "active":
        return {
          color: theme.colors.status.success,
          bgColor: theme.colors.status.successLight,
          label: "Active",
          icon: CheckCircle,
        };
      case "completed":
        return {
          color: theme.colors.primary.blue,
          bgColor: theme.colors.primaryShades.blue100,
          label: "Completed",
          icon: CheckCircle,
        };
      case "terminated":
        return {
          color: theme.colors.status.error,
          bgColor: theme.colors.status.errorLight,
          label: "Terminated",
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

  // Show loading state
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading session details...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  // Show error state
  if (error || !sessionData) {
    return (
      <SafeAreaWrapper>
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={theme.colors.status.error} />
          <Text style={styles.errorText}>{error || 'Session not found'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchSessionDetails()}
          >
            <RefreshCw size={20} color={theme.colors.primary.blue} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  const { session, owner, tenant, additionalCharges, roomCount } = sessionData;
  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;
  const progress = calculateProgress();

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary.blue]}
            tintColor={theme.colors.primary.blue}
          />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>Rent Session</Text>
              <Text style={styles.headerSubtitle}>
                {session.apartmentDisplay}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusConfig.bgColor },
              ]}
            >
              <StatusIcon size={14} color={statusConfig.color} />
              <Text style={[styles.statusText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Progress Card */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Session Progress</Text>
              <Text style={styles.progressPercentage}>
                {Math.round(progress)}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progress}%`,
                    backgroundColor: theme.colors.primary.blue,
                  },
                ]}
              />
            </View>
            <View style={styles.progressDetails}>
              <Text style={styles.progressDetailText}>
                {session.monthsCompleted || 0} of {session.durationMonths || 0}{" "}
                months completed
              </Text>
              <Text style={styles.progressDetailHighlight}>
                {session.monthsRemaining || 0} months remaining
              </Text>
            </View>
          </View>
        </View>

        {/* Parties Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parties Involved</Text>

          {/* Owner Card */}
          <View style={styles.partyCard}>
            <View style={styles.partyIconContainer}>
              <User size={20} color={theme.colors.primary.blue} />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyLabel}>Owner</Text>
              <Text style={styles.partyName}>{owner?.name || 'N/A'}</Text>
              <Text style={styles.partyContact}>{owner?.phone || 'N/A'}</Text>
            </View>
          </View>

          {/* Tenant Card */}
          <View style={styles.partyCard}>
            <View
              style={[
                styles.partyIconContainer,
                { backgroundColor: theme.colors.primaryShades.purple100 },
              ]}
            >
              <User size={20} color={theme.colors.primary.purple} />
            </View>
            <View style={styles.partyInfo}>
              <Text style={styles.partyLabel}>Tenant</Text>
              <Text style={styles.partyName}>{tenant?.name || 'N/A'}</Text>
              <Text style={styles.partyContact}>{tenant?.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Financial Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Details</Text>

          <View style={styles.financialCard}>
            {/* Main Charges */}
            <View style={styles.financialRow}>
              <View style={styles.financialLabel}>
                <Home size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.financialLabelText}>Monthly Rent</Text>
              </View>
              <Text style={styles.financialValue}>
                {formatCurrency(session.rentAmount)}
              </Text>
            </View>

            <View style={styles.financialRow}>
              <View style={styles.financialLabel}>
                <Package size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.financialLabelText}>Maintenance</Text>
              </View>
              <Text style={styles.financialValue}>
                {formatCurrency(session.maintenanceCost)}
              </Text>
            </View>

            <View style={styles.financialRow}>
              <View style={styles.financialLabel}>
                <DollarSign size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.financialLabelText}>Security Deposit</Text>
              </View>
              <Text style={styles.financialValue}>
                {formatCurrency(session.initialDeposit)}
              </Text>
            </View>

            {/* Additional Charges */}
            {additionalCharges && additionalCharges.length > 0 && (
              <>
                <View style={styles.divider} />
                <Text style={styles.additionalChargesTitle}>
                  Additional Charges
                </Text>

                {additionalCharges.map((charge) => (
                  <View key={charge.id} style={styles.financialRow}>
                    <Text style={styles.financialLabelText}>
                      {charge.chargeTitle}
                    </Text>
                    <Text style={styles.financialValue}>
                      {formatCurrency(charge.chargeAmount)}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Total */}
            <View style={styles.divider} />
            <View style={styles.financialRow}>
              <Text style={styles.financialTotalLabel}>
                Total Monthly Payment
              </Text>
              <Text style={styles.financialTotalValue}>
                {formatCurrency(session.totalMonthlyPayment || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Session Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Timeline</Text>

          <View style={styles.timelineCard}>
            <View style={styles.timelineRow}>
              <View style={styles.timelineLabel}>
                <Calendar size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.timelineLabelText}>Start Date</Text>
              </View>
              <Text style={styles.timelineValue}>
                {formatDate(session.startDate)}
              </Text>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineLabel}>
                <Calendar size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.timelineLabelText}>End Date</Text>
              </View>
              <Text style={styles.timelineValue}>
                {formatDate(session.endDate)}
              </Text>
            </View>

            <View style={styles.timelineRow}>
              <View style={styles.timelineLabel}>
                <Clock size={16} color={theme.colors.text.tertiary} />
                <Text style={styles.timelineLabelText}>Duration</Text>
              </View>
              <Text style={styles.timelineValue}>
                {session.durationMonths} months
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.nextPaymentCard}>
              <AlertCircle size={18} color={theme.colors.status.warning} />
              <View style={styles.nextPaymentInfo}>
                <Text style={styles.nextPaymentLabel}>Next Payment Due</Text>
                <Text style={styles.nextPaymentDate}>
                  {formatDate(session.nextPaymentDue)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleNavigate(`/user/rent/payment-history?sessionId=${sessionId}`)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.primaryShades.blue100 },
                ]}
              >
                <TrendingUp size={24} color={theme.colors.primary.blue} />
              </View>
              <Text style={styles.actionText}>Payment History</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleNavigate(`/user/documents?sessionId=${sessionId}`)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.primaryShades.purple100 },
                ]}
              >
                <FileText size={24} color={theme.colors.primary.purple} />
              </View>
              <Text style={styles.actionText}>Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleNavigate(`/user/rent/disputes?sessionId=${sessionId}`)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.status.warningLight },
                ]}
              >
                <MessageSquare size={24} color={theme.colors.status.warning} />
              </View>
              <Text style={styles.actionText}>Disputes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleNavigate(`/user/rent/edit-session?sessionId=${sessionId}`)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.actionIcon,
                  { backgroundColor: theme.colors.neutral.gray100 },
                ]}
              >
                <Edit2 size={24} color={theme.colors.neutral.gray700} />
              </View>
              <Text style={styles.actionText}>Edit Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terminate Session Button */}
        {session.status === "active" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.terminateButton}
              onPress={() => handleNavigate("/rent/terminate-session")}
              activeOpacity={0.7}
            >
              <XCircle size={20} color={theme.colors.status.error} />
              <Text style={styles.terminateButtonText}>
                Request Early Termination
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  header: {
    backgroundColor: theme.colors.primaryShades.blue50,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
  },
  progressCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  progressTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  progressPercentage: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: theme.colors.neutral.gray200,
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: theme.borderRadius.full,
  },
  progressDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressDetailText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  progressDetailHighlight: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  partyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  partyIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  partyInfo: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  partyContact: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  financialCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  financialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  financialLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  financialLabelText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  financialValue: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.sm,
  },
  additionalChargesTitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  financialTotalLabel: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  financialTotalValue: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  timelineCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  timelineRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.sm,
  },
  timelineLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  timelineLabelText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  timelineValue: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  nextPaymentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.status.warningLight,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  nextPaymentInfo: {
    flex: 1,
  },
  nextPaymentLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  nextPaymentDate: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.status.warning,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  actionText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  terminateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.errorLight,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.status.error,
  },
  terminateButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.error,
  },
  bottomSpacer: {
    height: theme.spacing.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.massive,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
  },
  errorText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
  },
  retryButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
});

export default RentSessionDetails;