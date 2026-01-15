import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import theme from "@/theme";
import {
  AlertCircle,
  Calendar,
  Car,
  Check,
  CheckCircle,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  Home,
  PawPrint,
  Plus,
  RefreshCw,
  Shield,
  Upload,
  User,
  X,
  XCircle
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
  View
} from "react-native";

import { Toast } from "@/components/RoomsManagementUI/Toast";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";

const DOCUMENT_TYPES = [
  "Rental Agreement",
  "Identity Proof",
  "Police Verification",
  "Income Proof",
  "Previous Rental Agreement",
  "Bank Statement",
  "Other",
];

// ============================================
// MAIN COMPONENT
// ============================================
const RentalAgreementAdminUI = () => {
  // Data state
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [addDocumentModalVisible, setAddDocumentModalVisible] = useState(false);
  const [addChargeModalVisible, setAddChargeModalVisible] = useState(false);
  const [editPreferencesModalVisible, setEditPreferencesModalVisible] =
    useState(false);

  // Add Document Form
  const [documentType, setDocumentType] = useState("");
  const [documentFile, setDocumentFile] = useState("");
  const [uploadedBy, setUploadedBy] = useState("owner");

  // Add Charge Form
  const [chargeTitle, setChargeTitle] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  // Edit Preferences Form
  const [numberOfCars, setNumberOfCars] = useState("");
  const [numberOfPets, setNumberOfPets] = useState("");
  const [ownerRestrictions, setOwnerRestrictions] = useState("");

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch sessions from API
  const fetchSessions = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        setError('Please login to view sessions');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.RENT_SESSIONS_LIST),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        // Combine owner and tenant sessions
        const allSessions = [...(data.asOwner || []), ...(data.asTenant || [])];
        setSessions(allSessions);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch sessions');
      }
    } catch (error) {
      console.error('Fetch sessions error:', error);
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSessions(false);
  }, [fetchSessions]);

  // Load sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleViewDetails = (session) => {
    setSelectedSession(session);
    setDetailsModalVisible(true);
  };

  const handleAddDocument = () => {
    if (!documentType) {
      showToast("Please select document type", "error");
      return;
    }
    if (!documentFile.trim()) {
      showToast("Please enter document filename", "error");
      return;
    }

    showToast("Document added successfully", "success");
    setDocumentType("");
    setDocumentFile("");
    setUploadedBy("owner");
    setAddDocumentModalVisible(false);
  };

  const handleAddCharge = () => {
    if (!chargeTitle.trim()) {
      showToast("Please enter charge title", "error");
      return;
    }
    if (!chargeAmount.trim()) {
      showToast("Please enter charge amount", "error");
      return;
    }

    showToast("Additional charge added successfully", "success");
    setChargeTitle("");
    setChargeAmount("");
    setAddChargeModalVisible(false);
  };

  const handleEditPreferences = () => {
    showToast("Preferences updated successfully", "success");
    setEditPreferencesModalVisible(false);
  };

  const openEditPreferences = (session) => {
    setSelectedSession(session);
    setNumberOfCars(session.tenantPreferences.numberOfCars.toString());
    setNumberOfPets(session.tenantPreferences.numberOfPets.toString());
    setOwnerRestrictions(session.tenantPreferences.ownerRestrictions);
    setEditPreferencesModalVisible(true);
  };

  const handleApproveDocument = (docId) => {
    showToast("Document approved", "success");
  };

  const handleRejectDocument = (docId) => {
    showToast("Document rejected", "error");
  };

  const getStatusBadge = (status) => {
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
          color: theme.colors.neutral.gray600,
          bgColor: theme.colors.neutral.gray100,
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
          icon: Clock,
        };
    }
  };

  const getDocStatusBadge = (status) => {
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

  const renderSessionCard = ({ item }) => {
    const statusBadge = getStatusBadge(item.status);
    const StatusIcon = statusBadge.icon;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.apartmentIconContainer}>
            <Home size={24} color={theme.colors.primary.blue} />
          </View>
          <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentNumber}>
              {item.towerName} - {item.apartmentNumber}
            </Text>
            <Text style={styles.tenantName}>{item.tenantName}</Text>
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

        <View style={styles.cardDivider} />

        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <DollarSign size={16} color={theme.colors.neutral.gray500} />
            <Text style={styles.detailLabel}>Rent:</Text>
            <Text style={styles.detailValue}>
              ₹{item.rentAmount.toLocaleString()}/month
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Calendar size={16} color={theme.colors.neutral.gray500} />
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>{item.durationMonths} months</Text>
          </View>
          <View style={styles.detailRow}>
            <FileText size={16} color={theme.colors.neutral.gray500} />
            <Text style={styles.detailLabel}>Documents:</Text>
            <Text style={styles.detailValue}>{item.documents.length}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.preferencesRow}>
            {item.tenantPreferences.numberOfCars > 0 && (
              <View style={styles.preferenceBadge}>
                <Car size={14} color={theme.colors.primary.blue} />
                <Text style={styles.preferenceText}>
                  {item.tenantPreferences.numberOfCars}
                </Text>
              </View>
            )}
            {item.tenantPreferences.numberOfPets > 0 && (
              <View style={styles.preferenceBadge}>
                <PawPrint size={14} color={theme.colors.primary.purple} />
                <Text style={styles.preferenceText}>
                  {item.tenantPreferences.numberOfPets}
                </Text>
              </View>
            )}
          </View>
          <ChevronRight size={20} color={theme.colors.neutral.gray400} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderDetailsModal = () => {
    if (!selectedSession) return null;

    return (
      <Modal
        visible={detailsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rental Agreement Details</Text>
              <TouchableOpacity
                onPress={() => setDetailsModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.neutral.gray700} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Basic Info Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Basic Information</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Apartment:</Text>
                    <Text style={styles.infoValue}>
                      {selectedSession.towerName} -{" "}
                      {selectedSession.apartmentNumber}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Owner:</Text>
                    <Text style={styles.infoValue}>
                      {selectedSession.ownerName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tenant:</Text>
                    <Text style={styles.infoValue}>
                      {selectedSession.tenantName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Start Date:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedSession.startDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>End Date:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(selectedSession.endDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Duration:</Text>
                    <Text style={styles.infoValue}>
                      {selectedSession.durationMonths} months
                    </Text>
                  </View>
                </View>
              </View>

              {/* Financial Details Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Financial Details</Text>
                <View style={styles.infoCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Rent Amount:</Text>
                    <Text style={styles.infoValueHighlight}>
                      ₹{selectedSession.rentAmount.toLocaleString()}/month
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Maintenance:</Text>
                    <Text style={styles.infoValue}>
                      ₹{selectedSession.maintenanceCost.toLocaleString()}/month
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Security Deposit:</Text>
                    <Text style={styles.infoValue}>
                      ₹{selectedSession.initialDeposit.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Additional Charges Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Additional Charges</Text>
                  <TouchableOpacity
                    style={styles.addIconButton}
                    onPress={() => setAddChargeModalVisible(true)}
                  >
                    <Plus size={16} color={theme.colors.primary.blue} />
                  </TouchableOpacity>
                </View>
                {selectedSession.additionalCharges.length > 0 ? (
                  <View style={styles.chargesList}>
                    {selectedSession.additionalCharges.map((charge) => (
                      <View key={charge.id} style={styles.chargeItem}>
                        <Text style={styles.chargeTitle}>
                          {charge.chargeTitle}
                        </Text>
                        <Text style={styles.chargeAmount}>
                          ₹{charge.chargeAmount.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No additional charges</Text>
                )}
              </View>

              {/* Tenant Preferences Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Tenant Preferences</Text>
                  <TouchableOpacity
                    style={styles.editIconButton}
                    onPress={() => openEditPreferences(selectedSession)}
                  >
                    <Edit2 size={16} color={theme.colors.primary.blue} />
                  </TouchableOpacity>
                </View>
                <View style={styles.preferencesCard}>
                  <View style={styles.preferenceItem}>
                    <Car size={20} color={theme.colors.primary.blue} />
                    <Text style={styles.preferenceLabel}>Number of Cars:</Text>
                    <Text style={styles.preferenceValue}>
                      {selectedSession.tenantPreferences.numberOfCars}
                    </Text>
                  </View>
                  <View style={styles.preferenceItem}>
                    <PawPrint size={20} color={theme.colors.primary.purple} />
                    <Text style={styles.preferenceLabel}>Number of Pets:</Text>
                    <Text style={styles.preferenceValue}>
                      {selectedSession.tenantPreferences.numberOfPets}
                    </Text>
                  </View>
                  {selectedSession.tenantPreferences.ownerRestrictions && (
                    <View style={styles.restrictionsContainer}>
                      <Shield size={16} color={theme.colors.status.warning} />
                      <Text style={styles.restrictionsLabel}>
                        Owner Restrictions:
                      </Text>
                      <Text style={styles.restrictionsText}>
                        {selectedSession.tenantPreferences.ownerRestrictions}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Tenant Questions Section */}
              {selectedSession.tenantQuestions.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tenant Responses</Text>
                  <View style={styles.questionsCard}>
                    {selectedSession.tenantQuestions.map((q) => (
                      <View key={q.id} style={styles.questionItem}>
                        <Text style={styles.questionText}>
                          Q: {q.questionText}
                        </Text>
                        <Text style={styles.answerText}>
                          A: {q.responseText}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Documents Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Documents</Text>
                  <TouchableOpacity
                    style={styles.addIconButton}
                    onPress={() => {
                      setDetailsModalVisible(false);
                      setAddDocumentModalVisible(true);
                    }}
                  >
                    <Plus size={16} color={theme.colors.primary.blue} />
                  </TouchableOpacity>
                </View>
                <View style={styles.documentsList}>
                  {selectedSession.documents.map((doc) => {
                    const docStatusBadge = getDocStatusBadge(
                      doc.approvalStatus
                    );
                    const DocStatusIcon = docStatusBadge.icon;

                    return (
                      <View key={doc.id} style={styles.documentItem}>
                        <View style={styles.documentIconContainer}>
                          <FileText
                            size={20}
                            color={theme.colors.primary.blue}
                          />
                        </View>
                        <View style={styles.documentInfo}>
                          <Text style={styles.documentType}>
                            {doc.documentType}
                          </Text>
                          <Text style={styles.documentFilename}>
                            {doc.documentFilename}
                          </Text>
                          <View style={styles.documentMeta}>
                            <User
                              size={12}
                              color={theme.colors.neutral.gray500}
                            />
                            <Text style={styles.documentMetaText}>
                              Uploaded by {doc.uploadedBy}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.documentActions}>
                          <View
                            style={[
                              styles.docStatusBadge,
                              { backgroundColor: docStatusBadge.bgColor },
                            ]}
                          >
                            <DocStatusIcon
                              size={10}
                              color={docStatusBadge.color}
                            />
                            <Text
                              style={[
                                styles.docStatusText,
                                { color: docStatusBadge.color },
                              ]}
                            >
                              {docStatusBadge.label}
                            </Text>
                          </View>
                          {doc.approvalStatus === "pending" && (
                            <View style={styles.documentActionButtons}>
                              <TouchableOpacity
                                style={styles.approveDocButton}
                                onPress={() => handleApproveDocument(doc.id)}
                              >
                                <Check
                                  size={14}
                                  color={theme.colors.status.success}
                                />
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.rejectDocButton}
                                onPress={() => handleRejectDocument(doc.id)}
                              >
                                <X
                                  size={14}
                                  color={theme.colors.status.error}
                                />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading sessions...</Text>
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
            onPress={() => fetchSessions()}
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
            <Text style={styles.headerTitle}>Rental Agreements</Text>
            <Text style={styles.headerSubtitle}>
              {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {/* Sessions List */}
        <FlatList
          data={sessions}
          renderItem={renderSessionCard}
          keyExtractor={(item) => `session-${item.id}`}
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
              <Home size={48} color={theme.colors.neutral.gray400} />
              <Text style={styles.emptyStateText}>No rental sessions yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create a new session to get started
              </Text>
            </View>
          }
        />

        {/* Details Modal */}
        {renderDetailsModal()}

        {/* Add Document Modal */}
        <Modal
          visible={addDocumentModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddDocumentModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Document</Text>
                <TouchableOpacity
                  onPress={() => setAddDocumentModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.neutral.gray700} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document Type *</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.docTypeScroll}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.docTypeChip,
                          documentType === type && styles.docTypeChipSelected,
                        ]}
                        onPress={() => setDocumentType(type)}
                      >
                        <Text
                          style={[
                            styles.docTypeChipText,
                            documentType === type &&
                              styles.docTypeChipTextSelected,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document Filename *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., rental_agreement.pdf"
                    value={documentFile}
                    onChangeText={setDocumentFile}
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Uploaded By *</Text>
                  <View style={styles.radioGroup}>
                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        uploadedBy === "owner" && styles.radioOptionSelected,
                      ]}
                      onPress={() => setUploadedBy("owner")}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          uploadedBy === "owner" && styles.radioCircleSelected,
                        ]}
                      >
                        {uploadedBy === "owner" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          uploadedBy === "owner" && styles.radioLabelSelected,
                        ]}
                      >
                        Owner
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.radioOption,
                        uploadedBy === "tenant" && styles.radioOptionSelected,
                      ]}
                      onPress={() => setUploadedBy("tenant")}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          uploadedBy === "tenant" && styles.radioCircleSelected,
                        ]}
                      >
                        {uploadedBy === "tenant" && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.radioLabel,
                          uploadedBy === "tenant" && styles.radioLabelSelected,
                        ]}
                      >
                        Tenant
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.uploadHint}>
                  <Upload size={16} color={theme.colors.primary.blue} />
                  <Text style={styles.uploadHintText}>
                    In production, this will upload to cloud storage
                  </Text>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setAddDocumentModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddDocument}
                  >
                    <View style={styles.submitButtonGradient}>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Add Document</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Add Charge Modal */}
        <Modal
          visible={addChargeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setAddChargeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Additional Charge</Text>
                <TouchableOpacity
                  onPress={() => setAddChargeModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.neutral.gray700} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Charge Title *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Parking Fee"
                    value={chargeTitle}
                    onChangeText={setChargeTitle}
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter amount"
                    value={chargeAmount}
                    onChangeText={setChargeAmount}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setAddChargeModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleAddCharge}
                  >
                    <View style={styles.submitButtonGradient}>
                      <Check size={20} color="#FFFFFF" />
                      <Text style={styles.submitButtonText}>Add Charge</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Preferences Modal */}
        <Modal
          visible={editPreferencesModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditPreferencesModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Tenant Preferences</Text>
                <TouchableOpacity
                  onPress={() => setEditPreferencesModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.neutral.gray700} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Number of Cars *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={numberOfCars}
                    onChangeText={setNumberOfCars}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Number of Pets *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={numberOfPets}
                    onChangeText={setNumberOfPets}
                    keyboardType="numeric"
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Owner Restrictions</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Enter any restrictions..."
                    value={ownerRestrictions}
                    onChangeText={setOwnerRestrictions}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={theme.colors.neutral.gray400}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setEditPreferencesModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleEditPreferences}
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
  listContent: {
    padding: theme.spacing.lg,
  },
  sessionCard: {
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
  apartmentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentNumber: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  tenantName: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
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
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
  },
  cardDivider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.md,
  },
  cardDetails: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  preferencesRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  preferenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    backgroundColor: theme.colors.neutral.gray100,
    borderRadius: 6,
  },
  preferenceText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  detailsModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: theme.spacing.xl,
    maxHeight: "90%",
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  addIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  infoValueHighlight: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  chargesList: {
    gap: theme.spacing.sm,
  },
  chargeItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.md,
  },
  chargeTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  chargeAmount: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    paddingVertical: theme.spacing.base,
  },
  preferencesCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    gap: theme.spacing.md,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  preferenceLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  preferenceValue: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  restrictionsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.warningLight,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.sm,
  },
  restrictionsLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.warning,
    marginRight: theme.spacing.xs,
  },
  restrictionsText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  questionsCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    gap: theme.spacing.base,
  },
  questionItem: {
    gap: theme.spacing.xs,
  },
  questionText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  answerText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    fontStyle: "italic",
  },
  documentsList: {
    gap: theme.spacing.md,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  documentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
    gap: 2,
  },
  documentType: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  documentFilename: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  documentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  documentMetaText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    textTransform: "capitalize",
  },
  documentActions: {
    alignItems: "flex-end",
    gap: theme.spacing.sm,
  },
  docStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 3,
    borderRadius: 6,
  },
  docStatusText: {
    fontSize: 10,
    fontFamily: theme.typography.fonts.semiBold,
  },
  documentActionButtons: {
    flexDirection: "row",
    gap: theme.spacing.xs,
  },
  approveDocButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.status.successLight,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectDocButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.status.errorLight,
    justifyContent: "center",
    alignItems: "center",
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
  docTypeScroll: {
    flexGrow: 0,
  },
  docTypeChip: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    marginRight: theme.spacing.sm,
  },
  docTypeChipSelected: {
    backgroundColor: theme.colors.primaryShades.blue100,
    borderColor: theme.colors.primary.blue,
  },
  docTypeChipText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  docTypeChipTextSelected: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
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
    minHeight: 100,
    textAlignVertical: "top",
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
  uploadHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  uploadHintText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.primary.blue,
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

export default RentalAgreementAdminUI;
