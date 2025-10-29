// ============================================
// FILE: app/security/upload-guest.jsx
// COMPLETE UPDATED VERSION - With SecurityService Integration
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import theme from '@/theme';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    AlertCircle,
    Camera,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    Package,
    Phone,
    RefreshCw,
    User,
    X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

// ✅ Import SecurityService
import securityService from '@/services/securityService';

// Company logos (local assets or URLs)
const DELIVERY_COMPANIES = [
  { id: 'amazon', name: 'Amazon', logo: 'amazon.png', color: '#FF9900' },
  { id: 'flipkart', name: 'Flipkart', logo: 'flipkart.png', color: '#2874F0' },
  { id: 'myntra', name: 'Myntra', logo: 'myntra.png', color: '#F43397' },
  { id: 'blinkit', name: 'Blinkit', logo: 'blinkit.png', color: '#F8CB46' },
  { id: 'zepto', name: 'Zepto', logo: 'zepto.png', color: '#8B45FF' },
  { id: 'swiggy', name: 'Swiggy', logo: 'swiggy.png', color: '#FC8019' },
  { id: 'zomato', name: 'Zomato', logo: 'zomato.png', color: '#E23744' },
  { id: 'dunzo', name: 'Dunzo', logo: 'dunzo.png', color: '#FF4D4D' },
  { id: 'bigbasket', name: 'BigBasket', logo: 'bigbasket.png', color: '#84C225' },
  { id: 'courier', name: 'Courier', logo: 'courier.png', color: '#6B7280' },
];

export default function UploadEntryScreen() {
  const router = useRouter();
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  
  // Entry type
  const [entryType, setEntryType] = useState('guest'); // 'guest' or 'delivery'
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);

  // Common state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Apartments list
  const [apartments, setApartments] = useState([]);
  const [loadingApartments, setLoadingApartments] = useState(true);
  const [showApartmentModal, setShowApartmentModal] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);

  // Company selection (for delivery)
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleNumber: '',
    purpose: '',
  });

  // ============================================
  // ✅ FETCH APARTMENTS ON MOUNT - UPDATED
  // ============================================
  useEffect(() => {
    fetchApartments();
  }, []);

  const fetchApartments = async () => {
    setLoadingApartments(true);
    
    const result = await securityService.fetchApartments();
    
    if (result.success) {
      setApartments(result.apartments);
      console.log(`✅ Loaded ${result.count} apartments`);
    } else {
      Alert.alert('Error', result.error || 'Failed to load apartments');
    }
    
    setLoadingApartments(false);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to capture photo.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          skipProcessing: false,
        });
        setCapturedPhoto(photo.uri);
        setPhotoUri(photo.uri);
        setShowCamera(false);
      } catch (err) {
        console.error('Error capturing photo:', err);
        Alert.alert('Error', 'Failed to capture photo');
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoUri(null);
    setShowCamera(true);
  };

  // ============================================
  // ✅ SUBMIT HANDLER - UPDATED WITH SecurityService
  // ============================================
  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setError(`${entryType === 'guest' ? 'Guest' : 'Delivery person'} name is required`);
      return;
    }

    if (entryType === 'guest' && !selectedApartment) {
      setError('Please select an apartment');
      return;
    }

    if (entryType === 'delivery' && !selectedCompany) {
      setError('Please select a delivery company');
      return;
    }

    if (!capturedPhoto) {
      setError('Photo is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let result;

      if (entryType === 'guest') {
        // ✅ Create guest entry using SecurityService
        result = await securityService.createGuestWithPhoto(photoUri, {
          guestName: formData.name,
          guestPhone: formData.phone || null,
          apartmentId: selectedApartment.id,
          vehicleNumber: formData.vehicleNumber || null,
          purpose: formData.purpose || null,
        });

        if (result.success) {
          Alert.alert(
            'Success',
            'Guest entry created successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.push({
                    pathname: '/security/guest-waiting',
                    params: { 
                      guestId: result.guestId,
                      qrCode: result.qrCode,
                    },
                  });
                },
              },
            ]
          );
        } else {
          setError(result.error || 'Failed to create guest entry');
          Alert.alert('Error', result.error || 'Failed to create guest entry');
        }
      } else {
        // ✅ Create delivery entry using SecurityService
        result = await securityService.createDeliveryWithPhoto(photoUri, {
          deliveryPersonName: formData.name,
          companyName: selectedCompany.name,
          companyLogo: selectedCompany.logo,
          vehicleNumber: formData.vehicleNumber || null,
          purpose: formData.purpose || null,
        });

        if (result.success) {
          Alert.alert(
            'Success',
            'Delivery entry created successfully!',
            [
              {
                text: 'OK',
                onPress: () => {
                  router.replace('/security/home');
                },
              },
            ]
          );
        } else {
          setError(result.error || 'Failed to create delivery entry');
          Alert.alert('Error', result.error || 'Failed to create delivery entry');
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit. Please try again.');
      Alert.alert('Error', 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // APARTMENT MODAL
  // ============================================
  const ApartmentModal = () => (
    <Modal
      visible={showApartmentModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowApartmentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowApartmentModal(false)}
        />
        <View style={styles.apartmentModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Apartment</Text>
            <TouchableOpacity onPress={() => setShowApartmentModal(false)}>
              <X size={24} color={theme.colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {loadingApartments ? (
            <View style={{ padding: theme.spacing.xl }}>
              <ActivityIndicator size="large" color={theme.colors.primary.main} />
            </View>
          ) : apartments.length === 0 ? (
            <Text style={styles.emptyText}>No apartments available</Text>
          ) : (
            <FlatList
              data={apartments}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.apartmentItem,
                    selectedApartment?.id === item.id && styles.apartmentItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedApartment(item);
                    setShowApartmentModal(false);
                    setError('');
                  }}
                >
                  <Text style={styles.apartmentText}>{item.displayName}</Text>
                  {selectedApartment?.id === item.id && (
                    <CheckCircle size={20} color="#10B981" />
                  )}
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );

  // ============================================
  // CAMERA VIEW
  // ============================================
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar style="light" />
        <CameraView style={styles.camera} ref={cameraRef} facing="back">
          <View style={styles.cameraHeader}>
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={() => setShowCamera(false)}
            >
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Take Photo</Text>
            <View style={styles.cameraSpacer} />
          </View>

          <View style={styles.cameraControls}>
            <TouchableOpacity style={styles.captureButton} onPress={capturePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  // ============================================
  // MAIN UI
  // ============================================
  return (
    <SafeAreaWrapper>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Entry</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Entry Type Selector */}
          <Animated.View entering={FadeInDown.delay(100)} style={styles.card}>
            <Text style={styles.cardTitle}>Entry Type</Text>
            <View style={styles.entryTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.entryTypeButton,
                  entryType === 'guest' && styles.entryTypeButtonActive,
                ]}
                onPress={() => {
                  setEntryType('guest');
                  setError('');
                }}
              >
                <User
                  size={20}
                  color={entryType === 'guest' ? '#FFFFFF' : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.entryTypeText,
                    entryType === 'guest' && styles.entryTypeTextActive,
                  ]}
                >
                  Guest
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.entryTypeButton,
                  entryType === 'delivery' && styles.entryTypeButtonActive,
                ]}
                onPress={() => {
                  setEntryType('delivery');
                  setError('');
                }}
              >
                <Package
                  size={20}
                  color={entryType === 'delivery' ? '#FFFFFF' : theme.colors.text.secondary}
                />
                <Text
                  style={[
                    styles.entryTypeText,
                    entryType === 'delivery' && styles.entryTypeTextActive,
                  ]}
                >
                  Delivery
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Photo Section */}
          <Animated.View entering={FadeInDown.delay(200)} style={styles.card}>
            <Text style={styles.cardTitle}>
              Photo <Text style={{ color: '#EF4444' }}>*</Text>
            </Text>
            {!capturedPhoto ? (
              <TouchableOpacity style={styles.photoPlaceholder} onPress={handleTakePhoto}>
                <Camera size={32} color={theme.colors.text.tertiary} />
                <Text style={styles.photoText}>Tap to capture photo</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.photoPreview}>
                <Image source={{ uri: capturedPhoto }} style={styles.capturedImage} />
                <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
                  <RefreshCw size={16} color="#FFFFFF" />
                  <Text style={styles.retakeText}>Retake</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Guest Form */}
          {entryType === 'guest' && (
            <>
              {/* Apartment Selection */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
                <Text style={styles.cardTitle}>
                  Apartment <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowApartmentModal(true)}
                >
                  <Text
                    style={[
                      styles.dropdownText,
                      !selectedApartment && styles.dropdownPlaceholder,
                    ]}
                  >
                    {selectedApartment ? selectedApartment.displayName : 'Select apartment'}
                  </Text>
                  <ChevronDown size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </Animated.View>

              {/* Guest Details */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
                <Text style={styles.cardTitle}>Guest Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Guest Name <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <User size={18} color={theme.colors.text.tertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter guest name"
                      value={formData.name}
                      onChangeText={(text) => updateField('name', text)}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Guest Phone (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={18} color={theme.colors.text.tertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChangeText={(text) => updateField('phone', text)}
                      keyboardType="phone-pad"
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vehicle Number (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.input, styles.vehicleIcon]}>🚗</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., KA01AB1234"
                      value={formData.vehicleNumber}
                      onChangeText={(text) => updateField('vehicleNumber', text.toUpperCase())}
                      autoCapitalize="characters"
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Purpose (Optional)</Text>
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Purpose of visit"
                      value={formData.purpose}
                      onChangeText={(text) => updateField('purpose', text)}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>
              </Animated.View>
            </>
          )}

          {/* Delivery Form */}
          {entryType === 'delivery' && (
            <>
              {/* Company Selection */}
              <Animated.View entering={FadeInDown.delay(300)} style={styles.card}>
                <Text style={styles.cardTitle}>
                  Delivery Company <Text style={{ color: '#EF4444' }}>*</Text>
                </Text>
                <View style={styles.companyGrid}>
                  {DELIVERY_COMPANIES.map((company) => (
                    <TouchableOpacity
                      key={company.id}
                      style={[
                        styles.companyCard,
                        selectedCompany?.id === company.id && styles.companyCardSelected,
                      ]}
                      onPress={() => {
                        setSelectedCompany(company);
                        setError('');
                      }}
                    >
                      <View
                        style={[styles.companyLogo, { backgroundColor: company.color }]}
                      >
                        <Text style={styles.companyIcon}>
                          {company.name.charAt(0)}
                        </Text>
                      </View>
                      <Text style={styles.companyName} numberOfLines={1}>
                        {company.name}
                      </Text>
                      {selectedCompany?.id === company.id && (
                        <View style={styles.selectedBadge}>
                          <CheckCircle size={16} color="#10B981" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>

              {/* Delivery Details */}
              <Animated.View entering={FadeInDown.delay(400)} style={styles.card}>
                <Text style={styles.cardTitle}>Delivery Details</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Delivery Person Name <Text style={{ color: '#EF4444' }}>*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <User size={18} color={theme.colors.text.tertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter delivery person name"
                      value={formData.name}
                      onChangeText={(text) => updateField('name', text)}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Vehicle Number (Optional)</Text>
                  <View style={styles.inputContainer}>
                    <Text style={[styles.input, styles.vehicleIcon]}>🚗</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g., KA01AB1234"
                      value={formData.vehicleNumber}
                      onChangeText={(text) => updateField('vehicleNumber', text.toUpperCase())}
                      autoCapitalize="characters"
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Purpose (Optional)</Text>
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Delivery notes"
                      value={formData.purpose}
                      onChangeText={(text) => updateField('purpose', text)}
                      multiline
                      numberOfLines={3}
                      placeholderTextColor={theme.colors.text.disabled}
                    />
                  </View>
                </View>
              </Animated.View>
            </>
          )}

          {/* Error Message */}
          {error ? (
            <Animated.View entering={FadeInDown} style={styles.errorContainer}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </Animated.View>
          ) : null}

          {/* Submit Button */}
          <Animated.View entering={FadeInUp.delay(500)} style={styles.submitButton}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[loading && styles.submitButtonDisabled]}
            >
              <LinearGradient
                colors={['#3B82F6', '#8B5CF6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.submitText}>
                      Create {entryType === 'guest' ? 'Guest' : 'Delivery'} Entry
                    </Text>
                    <CheckCircle size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Apartment Modal */}
        <ApartmentModal />
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },

  // Entry Type
  entryTypeContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  entryTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
  },
  entryTypeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  entryTypeText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
  },
  entryTypeTextActive: {
    color: '#FFFFFF',
  },

  // Photo
  photoPlaceholder: {
    height: 180,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.border.medium,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  photoText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.sm,
  },
  photoPreview: {
    position: 'relative',
  },
  capturedImage: {
    width: '100%',
    height: 180,
    borderRadius: theme.borderRadius.lg,
  },
  retakeButton: {
    position: 'absolute',
    bottom: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: theme.borderRadius.full,
  },
  retakeText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: '#FFFFFF',
  },

  // Company Grid
  companyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  companyCard: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
    position: 'relative',
  },
  companyCardSelected: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  companyLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  companyIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyName: {
    fontSize: 10,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },

  // Input Groups
  inputGroup: {
    marginBottom: theme.spacing.base,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    height: 52,
    gap: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  textAreaContainer: {
    height: 80,
    alignItems: 'flex-start',
    paddingVertical: theme.spacing.md,
  },
  textArea: {
    height: '100%',
    textAlignVertical: 'top',
  },
  vehicleIcon: {
    flex: 0,
    fontSize: 18,
  },

  // Dropdown
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    height: 52,
  },
  dropdownText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  dropdownPlaceholder: {
    color: theme.colors.text.disabled,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  apartmentModalContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.xxl,
    borderTopRightRadius: theme.borderRadius.xxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  apartmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  apartmentItemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  apartmentText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    padding: theme.spacing.xl,
  },

  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#FEE2E2',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.base,
  },
  errorText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: '#EF4444',
    flex: 1,
  },

  // Submit Button
  submitButton: {
    marginTop: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.base,
  },
  submitText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },

  bottomSpacer: {
    height: theme.spacing.xl,
  },

  // Camera
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
  cameraSpacer: {
    width: 40,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
});