// ============================================
// PAGE: Create Rent Session (Dynamic)
// Form to create a new rent session with API integration
// ============================================

import { Toast } from "@/components/RoomsManagementUI/Toast";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { useApartment } from "@/providers/ApartmentProvider";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Contacts from "expo-contacts";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import {
  Calendar,
  Check,
  ChevronDown,
  Clock,
  DollarSign,
  FileText,
  Home,
  Phone,
  Plus,
  Upload,
  User,
  Users,
  X,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const CreateRentSession = () => {
  const router = useRouter();
  const { userApartments, currentApartment, loading: apartmentLoading } = useApartment();

  // Form state
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [tenantPhone, setTenantPhone] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [rentAmount, setRentAmount] = useState("");
  const [maintenanceCost, setMaintenanceCost] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(null);
  const [durationMonths, setDurationMonths] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [ownerRestrictions, setOwnerRestrictions] = useState("");
  const [numberOfCars, setNumberOfCars] = useState("0");
  const [numberOfPets, setNumberOfPets] = useState("0");

  // Documents state
  const [documents, setDocuments] = useState([]);

  // Loading & UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Date picker state
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Modal state
  const [apartmentModalVisible, setApartmentModalVisible] = useState(false);
  const [addChargeModalVisible, setAddChargeModalVisible] = useState(false);
  const [documentModalVisible, setDocumentModalVisible] = useState(false);

  // Additional charge form
  const [chargeTitle, setChargeTitle] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");

  // Document form
  const [documentType, setDocumentType] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Filtered apartments (only owner apartments)
  const [ownerApartments, setOwnerApartments] = useState([]);

  useEffect(() => {
    // Filter apartments where user is owner
    const filtered = userApartments.filter(
      (apt) => apt.ownershipType === "owner" && apt.isAdminApproved
    );
    setOwnerApartments(filtered);

    // Auto-select current apartment if it's owner-type
    if (currentApartment && currentApartment.ownershipType === "owner") {
      setSelectedApartment(currentApartment);
    }
  }, [userApartments, currentApartment]);

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handlePickContact = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== "granted") {
        showToast("Contact permission denied", "error");
        return;
      }

      const contact = await Contacts.presentContactPickerAsync();
      if (contact) {
        setTenantName(contact.name || "");

        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
          // Clean phone number - remove spaces, dashes, parentheses
          let phone = contact.phoneNumbers[0].number || "";
          phone = phone.replace(/[\s\-()]/g, "");
          setTenantPhone(phone);
        }

        showToast("Contact selected successfully", "success");
      }
    } catch (error) {
      console.error("Error picking contact:", error);
      showToast("Failed to pick contact", "error");
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const doc = result.assets[0];
        setSelectedDocument(doc);
        showToast("Document selected", "success");
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showToast("Failed to pick document", "error");
    }
  };

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        showToast("Gallery permission denied", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const image = result.assets[0];
        setSelectedDocument({
          uri: image.uri,
          name: `document_${Date.now()}.jpg`,
          type: "image/jpeg",
          size: image.fileSize || 0,
        });
        showToast("Image selected", "success");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showToast("Failed to pick image", "error");
    }
  };

  const handleAddDocument = () => {
    if (!documentType.trim()) {
      showToast("Please enter document type", "error");
      return;
    }
    if (!selectedDocument) {
      showToast("Please select a document", "error");
      return;
    }

    const newDocument = {
      id: Date.now(),
      documentType: documentType.trim(),
      file: selectedDocument,
      fileName: selectedDocument.name,
      fileSize: selectedDocument.size,
    };

    setDocuments([...documents, newDocument]);
    setDocumentType("");
    setSelectedDocument(null);
    setDocumentModalVisible(false);
    showToast("Document added successfully", "success");
  };

  const handleRemoveDocument = (id) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
    showToast("Document removed", "success");
  };

  const onStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const formatDateForDisplay = (date) => {
    if (!date) return "Not Set";
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
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

    const newCharge = {
      id: Date.now(),
      chargeTitle: chargeTitle.trim(),
      chargeAmount: parseFloat(chargeAmount),
    };

    setAdditionalCharges([...additionalCharges, newCharge]);
    setChargeTitle("");
    setChargeAmount("");
    setAddChargeModalVisible(false);
    showToast("Charge added successfully", "success");
  };

  const handleRemoveCharge = (id) => {
    setAdditionalCharges(
      additionalCharges.filter((charge) => charge.id !== id)
    );
    showToast("Charge removed", "success");
  };

  const calculateTotalMonthly = () => {
    const rent = parseFloat(rentAmount) || 0;
    const maintenance = parseFloat(maintenanceCost) || 0;
    const additional = additionalCharges.reduce(
      (sum, charge) => sum + charge.chargeAmount,
      0
    );
    return rent + maintenance + additional;
  };

  const validateForm = () => {
    if (!selectedApartment) {
      showToast("Please select an apartment", "error");
      return false;
    }

    // Verify ownership type
    if (selectedApartment.ownershipType !== "owner") {
      showToast("Only apartment owners can create rent sessions", "error");
      return false;
    }

    if (!tenantPhone.trim()) {
      showToast("Please enter tenant phone number", "error");
      return false;
    }

    // Validate phone number format (10 digits)
    const cleanPhone = tenantPhone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return false;
    }

    if (!rentAmount.trim()) {
      showToast("Please enter rent amount", "error");
      return false;
    }

    if (parseFloat(rentAmount) <= 0) {
      showToast("Rent amount must be greater than 0", "error");
      return false;
    }

    if (!durationMonths.trim()) {
      showToast("Please enter duration", "error");
      return false;
    }

    if (parseInt(durationMonths) <= 0) {
      showToast("Duration must be greater than 0", "error");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("Authentication required", "error");
        setSubmitting(false);
        return;
      }

      // Prepare payload
      const payload = {
        apartmentId: selectedApartment.apartmentId,
        tenantPhone: tenantPhone.replace(/\D/g, ""), // Clean phone
        tenantName: tenantName.trim() || undefined,
        rentAmount: parseFloat(rentAmount),
        maintenanceCost: maintenanceCost ? parseFloat(maintenanceCost) : 0,
        initialDeposit: initialDeposit ? parseFloat(initialDeposit) : 0,
        startDate: formatDateForAPI(startDate),
        endDate: endDate ? formatDateForAPI(endDate) : null,
        durationMonths: parseInt(durationMonths),
        additionalCharges:
          additionalCharges.length > 0
            ? additionalCharges.map((charge) => ({
                chargeTitle: charge.chargeTitle,
                chargeAmount: charge.chargeAmount,
              }))
            : [],
        ownerRestrictions: ownerRestrictions.trim() || null,
        numberOfCars: parseInt(numberOfCars) || 0,
        numberOfPets: parseInt(numberOfPets) || 0,
      };

      console.log("📤 Creating rent session:", payload);

      // Create rent session
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.RENT_SESSIONS || "/api/mobile-api/user/rent-sessions"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("📥 Rent session response:", data);

      if (!response.ok || !data.success) {
        if (data.tenantNotFound) {
          Alert.alert(
            "Tenant Not Found",
            "The tenant with this phone number is not registered on the app. Please ask them to sign up first.",
            [{ text: "OK" }]
          );
        } else if (data.isOwner === false) {
          Alert.alert(
            "Access Denied",
            "Only apartment owners can create rent sessions.",
            [{ text: "OK" }]
          );
        } else {
          showToast(data.message || "Failed to create rent session", "error");
        }
        setSubmitting(false);
        return;
      }

      const sessionId = data.sessionId;

      // Upload documents if any
      if (documents.length > 0) {
        showToast("Uploading documents...", "info");
        await uploadDocuments(sessionId, token);
      }

      showToast("Rent session created successfully!", "success");

      // Navigate back or to session details after 1.5 seconds
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("❌ Error creating rent session:", error);
      showToast("An error occurred. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const uploadDocuments = async (sessionId, token) => {
    for (const doc of documents) {
      try {
        const formData = new FormData();
        formData.append("sessionId", sessionId.toString());
        formData.append("documentType", doc.documentType);
        formData.append("file", {
          uri: doc.file.uri,
          name: doc.fileName,
          type: doc.file.type || "application/octet-stream",
        });

        const response = await fetch(
          buildApiUrl(
            API_ENDPOINTS.RENT_SESSION_DOCUMENTS ||
              "/api/mobile-api/user/rent-sessions/documents"
          ),
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
            body: formData,
          }
        );

        const result = await response.json();
        console.log(`📄 Document upload result (${doc.documentType}):`, result);

        if (!response.ok || !result.success) {
          console.error(`Failed to upload ${doc.documentType}`);
        }
      } catch (error) {
        console.error(`Error uploading document ${doc.documentType}:`, error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (apartmentLoading) {
    return (
      <SafeAreaWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading apartments...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (ownerApartments.length === 0) {
    return (
      <SafeAreaWrapper>
        <View style={styles.emptyContainer}>
          <Home size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Apartments Available</Text>
          <Text style={styles.emptySubtitle}>
            You need to be an owner of an apartment to create rent sessions.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.emptyButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Rent Session</Text>
          <Text style={styles.headerSubtitle}>
            Set up a new rental agreement
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Apartment Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Select Apartment *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setApartmentModalVisible(true)}
              activeOpacity={0.7}
            >
              <Home size={20} color={theme.colors.text.tertiary} />
              <Text
                style={[
                  styles.selectButtonText,
                  !selectedApartment && styles.selectButtonPlaceholder,
                ]}
              >
                {selectedApartment
                  ? `${selectedApartment.apartmentNumber}, ${selectedApartment.towerName || "N/A"}`
                  : "Choose apartment"}
              </Text>
              <ChevronDown size={20} color={theme.colors.text.tertiary} />
            </TouchableOpacity>
            {selectedApartment && (
              <Text style={styles.selectHint}>
                {selectedApartment.communityName}
              </Text>
            )}
          </View>

          {/* Tenant Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tenant Phone Number *</Text>
            <View style={styles.inputWithIcon}>
              <Phone size={20} color={theme.colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                value={tenantPhone}
                onChangeText={setTenantPhone}
                keyboardType="phone-pad"
                maxLength={15}
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
            <TouchableOpacity
              style={styles.contactPickerButton}
              onPress={handlePickContact}
              activeOpacity={0.7}
            >
              <Users size={16} color={theme.colors.primary.blue} />
              <Text style={styles.contactPickerText}>Pick from Contacts</Text>
            </TouchableOpacity>
          </View>

          {/* Tenant Name (Optional) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tenant Name (Optional)</Text>
            <View style={styles.inputWithIcon}>
              <User size={20} color={theme.colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                value={tenantName}
                onChangeText={setTenantName}
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          {/* Financial Details Section */}
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={theme.colors.primary.blue} />
            <Text style={styles.sectionTitle}>Financial Details</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Rent *</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="25000"
                value={rentAmount}
                onChangeText={setRentAmount}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Maintenance Cost</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="3500"
                value={maintenanceCost}
                onChangeText={setMaintenanceCost}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Security Deposit</Text>
            <View style={styles.inputWithIcon}>
              <Text style={styles.inputIcon}>₹</Text>
              <TextInput
                style={styles.input}
                placeholder="50000"
                value={initialDeposit}
                onChangeText={setInitialDeposit}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          {/* Additional Charges */}
          <View style={styles.additionalChargesSection}>
            <View style={styles.additionalChargesHeader}>
              <Text style={styles.inputLabel}>Additional Charges</Text>
              <TouchableOpacity
                onPress={() => setAddChargeModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.addChargeButton}>
                  <Plus size={16} color={theme.colors.primary.blue} />
                  <Text style={styles.addChargeButtonText}>Add</Text>
                </View>
              </TouchableOpacity>
            </View>

            {additionalCharges.map((charge) => (
              <View key={charge.id} style={styles.chargeItem}>
                <View style={styles.chargeInfo}>
                  <Text style={styles.chargeTitle}>{charge.chargeTitle}</Text>
                  <Text style={styles.chargeAmount}>
                    {formatCurrency(charge.chargeAmount)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveCharge(charge.id)}
                  style={styles.removeChargeButton}
                >
                  <X size={16} color={theme.colors.status.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Total Monthly */}
          {(rentAmount || maintenanceCost || additionalCharges.length > 0) && (
            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Monthly Payment</Text>
              <Text style={styles.totalAmount}>
                {formatCurrency(calculateTotalMonthly())}
              </Text>
            </View>
          )}

          {/* Timeline Section */}
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={theme.colors.primary.blue} />
            <Text style={styles.sectionTitle}>Timeline</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Date *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowStartDatePicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={20} color={theme.colors.text.tertiary} />
              <Text style={styles.datePickerText}>
                {formatDateForDisplay(startDate)}
              </Text>
            </TouchableOpacity>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onStartDateChange}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>End Date (Optional)</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowEndDatePicker(true)}
              activeOpacity={0.7}
            >
              <Calendar size={20} color={theme.colors.text.tertiary} />
              <Text style={styles.datePickerText}>
                {formatDateForDisplay(endDate)}
              </Text>
            </TouchableOpacity>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onEndDateChange}
                minimumDate={startDate}
              />
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Duration (Months) *</Text>
            <View style={styles.inputWithIcon}>
              <Clock size={20} color={theme.colors.text.tertiary} />
              <TextInput
                style={styles.input}
                placeholder="12"
                value={durationMonths}
                onChangeText={setDurationMonths}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          {/* Tenant Preferences Section */}
          <View style={styles.sectionHeader}>
            <User size={20} color={theme.colors.primary.blue} />
            <Text style={styles.sectionTitle}>Tenant Preferences</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Cars</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={numberOfCars}
                onChangeText={setNumberOfCars}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Number of Pets</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.input}
                placeholder="0"
                value={numberOfPets}
                onChangeText={setNumberOfPets}
                keyboardType="numeric"
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Owner Restrictions (Optional)
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any specific restrictions or notes..."
              value={ownerRestrictions}
              onChangeText={setOwnerRestrictions}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={theme.colors.text.placeholder}
            />
          </View>

          {/* Documents Section */}
          <View style={styles.sectionHeader}>
            <FileText size={20} color={theme.colors.primary.blue} />
            <Text style={styles.sectionTitle}>Documents</Text>
          </View>

          <View style={styles.additionalChargesSection}>
            <View style={styles.additionalChargesHeader}>
              <Text style={styles.inputLabel}>Rental Agreement Documents</Text>
              <TouchableOpacity
                onPress={() => setDocumentModalVisible(true)}
                activeOpacity={0.7}
              >
                <View style={styles.addChargeButton}>
                  <Plus size={16} color={theme.colors.primary.blue} />
                  <Text style={styles.addChargeButtonText}>Add</Text>
                </View>
              </TouchableOpacity>
            </View>

            {documents.map((doc) => (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <FileText size={20} color={theme.colors.primary.blue} />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentType}>{doc.documentType}</Text>
                  <Text style={styles.documentName}>
                    {doc.fileName} ({formatFileSize(doc.fileSize)})
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveDocument(doc.id)}
                  style={styles.removeChargeButton}
                >
                  <X size={16} color={theme.colors.status.error} />
                </TouchableOpacity>
              </View>
            ))}

            {documents.length === 0 && (
              <Text style={styles.noDocumentsText}>
                No documents added yet. Add rental agreement, ID proof, or other
                relevant documents.
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>
                  Create Rent Session
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Apartment Selection Modal */}
      <Modal
        visible={apartmentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setApartmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Apartment</Text>
              <TouchableOpacity
                onPress={() => setApartmentModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {ownerApartments.map((apartment) => (
                <TouchableOpacity
                  key={apartment.apartmentId}
                  style={[
                    styles.modalItem,
                    selectedApartment?.apartmentId === apartment.apartmentId &&
                      styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedApartment(apartment);
                    setApartmentModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modalItemIcon}>
                    <Home size={20} color={theme.colors.primary.blue} />
                  </View>
                  <View style={styles.modalItemInfo}>
                    <Text style={styles.modalItemTitle}>
                      {apartment.apartmentNumber}
                      {apartment.towerName && `, ${apartment.towerName}`}
                    </Text>
                    <Text style={styles.modalItemSubtitle}>
                      {apartment.communityName}
                    </Text>
                  </View>
                  {selectedApartment?.apartmentId === apartment.apartmentId && (
                    <Check size={20} color={theme.colors.primary.blue} />
                  )}
                </TouchableOpacity>
              ))}
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
              <Text style={styles.modalTitle}>Add Charge</Text>
              <TouchableOpacity
                onPress={() => setAddChargeModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Charge Title *</Text>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="e.g., Water Charges"
                value={chargeTitle}
                onChangeText={setChargeTitle}
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount *</Text>
              <View style={styles.inputWithIcon}>
                <Text style={styles.inputIcon}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="500"
                  value={chargeAmount}
                  onChangeText={setChargeAmount}
                  keyboardType="numeric"
                  placeholderTextColor={theme.colors.text.placeholder}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setAddChargeModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddCharge}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Charge</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Document Modal */}
      <Modal
        visible={documentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDocumentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Document</Text>
              <TouchableOpacity
                onPress={() => setDocumentModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Document Type *</Text>
              <TextInput
                style={[styles.input, styles.modalInput]}
                placeholder="e.g., Rental Agreement, ID Proof"
                value={documentType}
                onChangeText={setDocumentType}
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select File *</Text>
              <View style={styles.documentPickerContainer}>
                <TouchableOpacity
                  style={styles.documentPickerButton}
                  onPress={handlePickDocument}
                  activeOpacity={0.7}
                >
                  <Upload size={20} color={theme.colors.primary.blue} />
                  <Text style={styles.documentPickerText}>
                    Choose Document
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.documentPickerButton}
                  onPress={handlePickImage}
                  activeOpacity={0.7}
                >
                  <Upload size={20} color={theme.colors.primary.blue} />
                  <Text style={styles.documentPickerText}>
                    Choose Image
                  </Text>
                </TouchableOpacity>
              </View>

              {selectedDocument && (
                <View style={styles.selectedDocumentPreview}>
                  <FileText size={16} color={theme.colors.primary.blue} />
                  <Text style={styles.selectedDocumentName}>
                    {selectedDocument.name}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setDocumentModalVisible(false);
                  setDocumentType("");
                  setSelectedDocument(null);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddDocument}
                activeOpacity={0.7}
              >
                <Plus size={18} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Document</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </SafeAreaWrapper>
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
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.button,
  },
  emptyButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
  },
  header: {
    backgroundColor: theme.colors.primaryShades.blue50,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
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
  form: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
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
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  inputWithIcon: {
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
  inputIcon: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.tertiary,
  },
  selectButton: {
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
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  selectButtonPlaceholder: {
    color: theme.colors.text.placeholder,
  },
  selectHint: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  contactPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    alignSelf: "flex-start",
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderRadius: theme.borderRadius.input,
    marginTop: theme.spacing.sm,
  },
  contactPickerText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  datePickerButton: {
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
  datePickerText: {
    flex: 1,
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
  },
  modalInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  additionalChargesSection: {
    marginBottom: theme.spacing.xl,
  },
  additionalChargesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  addChargeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue100,
    borderRadius: theme.borderRadius.input,
  },
  addChargeButtonText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  chargeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  chargeInfo: {
    flex: 1,
  },
  chargeTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  chargeAmount: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  removeChargeButton: {
    padding: theme.spacing.xs,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  documentName: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  noDocumentsText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    textAlign: "center",
    paddingVertical: theme.spacing.lg,
  },
  documentPickerContainer: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  documentPickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderRadius: theme.borderRadius.input,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
    borderStyle: "dashed",
  },
  documentPickerText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  selectedDocumentPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderRadius: theme.borderRadius.sm,
  },
  selectedDocumentName: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  totalCard: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
    borderStyle: "dashed",
  },
  totalLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
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
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  modalItemSelected: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  modalItemIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  modalItemInfo: {
    flex: 1,
  },
  modalItemTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  modalItemSubtitle: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
  },
  modalActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  cancelButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  addButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  addButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: theme.spacing.xxxl,
  },
});

export default CreateRentSession;