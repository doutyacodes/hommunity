// ============================================
// FILE: app/(user)/user/apartment-request-form.jsx
// Step 3: Complete Apartment Request Form
// Includes: Ownership type, Members, Rule Responses (text/image)
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { buildApiUrl, getApiHeaders, PHOTO_CONFIG } from '@/config/apiConfig';
import { getAuthToken } from '@/services/authService';
import theme from '@/theme';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    CheckCircle2,
    ChevronLeft,
    FileText,
    Image as ImageIcon,
    Plus,
    Send,
    Users,
    X
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

export default function ApartmentRequestFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    communityId,
    communityName,
    apartmentId,
    apartmentNumber,
    towerName,
    floorNumber,
  } = params;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rules, setRules] = useState([]);

  // Form state
  const [ownershipType, setOwnershipType] = useState('owner');
  const [members, setMembers] = useState([
    { name: '', mobileNumber: '', relation: '' },
  ]);
  const [ruleResponses, setRuleResponses] = useState({});

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/mobile-api/user/communities/${communityId}/rules`)
      );
      const data = await response.json();

      if (data.success) {
        setRules(data.data.rules || []);
        // Initialize rule responses
        const initialResponses = {};
        data.data.rules?.forEach((rule) => {
          initialResponses[rule.id] = {
            textResponse: '',
            imageFilename: null,
            imageUri: null,
          };
        });
        setRuleResponses(initialResponses);
      }
    } catch (err) {
      console.error('Fetch rules error:', err);
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    setMembers([...members, { name: '', mobileNumber: '', relation: '' }]);
  };

  const removeMember = (index) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index, field, value) => {
    const updated = [...members];
    updated[index][field] = value;
    setMembers(updated);
  };

  const updateRuleResponse = (ruleId, field, value) => {
    setRuleResponses((prev) => ({
      ...prev,
      [ruleId]: {
        ...prev[ruleId],
        [field]: value,
      },
    }));
  };

  const pickImageForRule = async (ruleId) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        
        // Upload image
        const filename = await uploadImage(uri);
        
        if (filename) {
          updateRuleResponse(ruleId, 'imageFilename', filename);
          updateRuleResponse(ruleId, 'imageUri', uri);
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadImage = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: `rule_${Date.now()}.jpg`,
      });

      const response = await fetch(PHOTO_CONFIG.UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = await response.json();

      if (data.success && data.filename) {
        return data.filename;
      }

      throw new Error(data.error || 'Upload failed');
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', 'Could not upload image');
      return null;
    }
  };

  const validateForm = () => {
    // Check mandatory rules
    for (const rule of rules) {
      if (rule.isMandatory) {
        const response = ruleResponses[rule.id];
        
        if (rule.proofType === 'text' && !response?.textResponse?.trim()) {
          Alert.alert('Required Field', `Please provide text response for: ${rule.ruleName}`);
          return false;
        }
        
        if (rule.proofType === 'image' && !response?.imageFilename) {
          Alert.alert('Required Field', `Please upload image for: ${rule.ruleName}`);
          return false;
        }
        
        if (rule.proofType === 'both' && (!response?.textResponse?.trim() || !response?.imageFilename)) {
          Alert.alert('Required Field', `Please provide both text and image for: ${rule.ruleName}`);
          return false;
        }
      }
    }

    // Validate members
    const validMembers = members.filter((m) => m.name.trim() !== '');
    if (validMembers.length === 0) {
      Alert.alert('Members Required', 'Please add at least one family member');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);

    try {
      const token = await getAuthToken();

      // Prepare rule responses
      const ruleResponsesArray = Object.entries(ruleResponses)
        .filter(([ruleId, response]) => {
          return response.textResponse?.trim() || response.imageFilename;
        })
        .map(([ruleId, response]) => ({
          ruleId: parseInt(ruleId),
          textResponse: response.textResponse?.trim() || null,
          imageFilename: response.imageFilename || null,
        }));

      // Prepare members
      const validMembers = members
        .filter((m) => m.name.trim() !== '')
        .map((m) => ({
          name: m.name.trim(),
          mobileNumber: m.mobileNumber?.trim() || null,
          relation: m.relation?.trim() || null,
        }));

      const requestData = {
        apartmentId: parseInt(apartmentId),
        communityId: parseInt(communityId),
        ownershipType,
        members: validMembers,
        ruleResponses: ruleResponsesArray,
      };

      const response = await fetch(
        buildApiUrl('/api/mobile-api/user/apartment-requests'),
        {
          method: 'POST',
          headers: getApiHeaders(token),
          body: JSON.stringify(requestData),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Request Submitted!',
          'Your apartment request has been submitted. The community admin will review it shortly.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/user/home'),
            },
          ]
        );
      } else {
        Alert.alert('Error', data.error || 'Failed to submit request');
      }
    } catch (err) {
      console.error('Submit error:', err);
      Alert.alert('Error', 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading form...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.duration(600)} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Complete Request</Text>
            <Text style={styles.headerSubtitle}>
              {towerName ? `${towerName} - ` : ''}
              {apartmentNumber}
            </Text>
            <Text style={styles.stepText}>Step 3 of 3</Text>
          </View>
        </Animated.View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Ownership Type */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>Ownership Type</Text>
            <View style={styles.ownershipContainer}>
              <TouchableOpacity
                style={[
                  styles.ownershipButton,
                  ownershipType === 'owner' && styles.ownershipButtonActive,
                ]}
                onPress={() => setOwnershipType('owner')}
              >
                <Text
                  style={[
                    styles.ownershipButtonText,
                    ownershipType === 'owner' && styles.ownershipButtonTextActive,
                  ]}
                >
                  Owner
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ownershipButton,
                  ownershipType === 'tenant' && styles.ownershipButtonActive,
                ]}
                onPress={() => setOwnershipType('tenant')}
              >
                <Text
                  style={[
                    styles.ownershipButtonText,
                    ownershipType === 'tenant' && styles.ownershipButtonTextActive,
                  ]}
                >
                  Tenant
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Family Members */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Users size={20} color={theme.colors.primary.blue} />
              <Text style={styles.sectionTitle}>Family Members</Text>
            </View>

            {members.map((member, index) => (
              <View key={index} style={styles.memberCard}>
                <View style={styles.memberHeader}>
                  <Text style={styles.memberTitle}>Member {index + 1}</Text>
                  {members.length > 1 && (
                    <TouchableOpacity onPress={() => removeMember(index)}>
                      <X size={20} color={theme.colors.status.error} />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Name *"
                  placeholderTextColor={theme.colors.neutral.gray400}
                  value={member.name}
                  onChangeText={(text) => updateMember(index, 'name', text)}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Mobile Number (Optional)"
                  placeholderTextColor={theme.colors.neutral.gray400}
                  value={member.mobileNumber}
                  onChangeText={(text) => updateMember(index, 'mobileNumber', text)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Relation (Optional)"
                  placeholderTextColor={theme.colors.neutral.gray400}
                  value={member.relation}
                  onChangeText={(text) => updateMember(index, 'relation', text)}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addMember}>
              <Plus size={20} color={theme.colors.primary.blue} />
              <Text style={styles.addButtonText}>Add Another Member</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Community Rules */}
          {rules.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(600).delay(300)}
              style={styles.section}
            >
              <View style={styles.sectionHeader}>
                <FileText size={20} color={theme.colors.primary.purple} />
                <Text style={styles.sectionTitle}>Community Rules</Text>
              </View>

              {rules.map((rule, index) => (
                <View key={rule.id} style={styles.ruleCard}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleName}>{rule.ruleName}</Text>
                    {rule.isMandatory && (
                      <View style={styles.mandatoryBadge}>
                        <Text style={styles.mandatoryText}>Required</Text>
                      </View>
                    )}
                  </View>

                  {rule.description && (
                    <Text style={styles.ruleDescription}>{rule.description}</Text>
                  )}

                  {/* Text Response */}
                  {(rule.proofType === 'text' || rule.proofType === 'both') && (
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="Your response..."
                      placeholderTextColor={theme.colors.neutral.gray400}
                      value={ruleResponses[rule.id]?.textResponse || ''}
                      onChangeText={(text) =>
                        updateRuleResponse(rule.id, 'textResponse', text)
                      }
                      multiline
                      numberOfLines={3}
                    />
                  )}

                  {/* Image Upload */}
                  {(rule.proofType === 'image' || rule.proofType === 'both') && (
                    <TouchableOpacity
                      style={styles.imageButton}
                      onPress={() => pickImageForRule(rule.id)}
                    >
                      {ruleResponses[rule.id]?.imageUri ? (
                        <View style={styles.imagePreviewContainer}>
                          <Image
                            source={{ uri: ruleResponses[rule.id].imageUri }}
                            style={styles.imagePreview}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <CheckCircle2 size={24} color="#FFFFFF" />
                            <Text style={styles.imageOverlayText}>Tap to change</Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.uploadPlaceholder}>
                          <ImageIcon size={24} color={theme.colors.primary.blue} />
                          <Text style={styles.uploadText}>Upload Image</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </Animated.View>
          )}

          {/* Submit Button */}
          <Animated.View
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.submitContainer}
          >
            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  submitting
                    ? ['#9CA3AF', '#9CA3AF']
                    : theme.colors.background.gradientPrimary
                }
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Send size={20} color="#FFFFFF" />
                    <Text style={styles.submitText}>Submit Request</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.primary.blue,
    marginTop: 2,
  },
  stepText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    flex: 1,
  },
  ownershipContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  ownershipButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  ownershipButtonActive: {
    borderColor: theme.colors.primary.blue,
    backgroundColor: theme.colors.primaryShades.blue50,
  },
  ownershipButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
  },
  ownershipButtonTextActive: {
    color: theme.colors.primary.blue,
  },
  memberCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  memberTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  input: {
    backgroundColor: theme.colors.neutral.gray100,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.blue,
    backgroundColor: theme.colors.primaryShades.blue50,
  },
  addButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  ruleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  ruleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  ruleName: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  mandatoryBadge: {
    backgroundColor: theme.colors.status.errorLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mandatoryText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.status.error,
  },
  ruleDescription: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
  },
  imageButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  uploadPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.lg,
  },
  uploadText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.lg,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  imageOverlayText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: '#FFFFFF',
  },
  submitContainer: {
    marginTop: theme.spacing.lg,
  },
  submitButton: {
    borderRadius: theme.borderRadius.button,
    overflow: 'hidden',
    ...theme.shadows.lg,
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
    minHeight: 56,
  },
  submitText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
});