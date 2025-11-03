// ============================================
// FILE: app/user/members.jsx
// Members Management Screen - Modern, Clean & Futuristic Design
// ============================================
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '@/theme';
import { buildApiUrl, getApiHeaders } from '@/config/apiConfig';
import { getAuthToken, getUserData } from '@/services/authService';

export default function MembersScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [apartmentId, setApartmentId] = useState(null);
  const [apartmentInfo, setApartmentInfo] = useState(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobileNumber: '',
    relation: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    initializeScreen();
  }, []);

  const initializeScreen = async () => {
    try {
      const userData = await getUserData();

      // Get apartment from params or use current apartment
      const apId = params.apartmentId || userData?.currentApartmentId;

      if (!apId) {
        Alert.alert('Error', 'No apartment selected');
        router.back();
        return;
      }

      setApartmentId(apId);
      setApartmentInfo({
        number: params.apartmentNumber || userData?.apartmentNumber || '',
        tower: params.towerName || userData?.towerName || '',
      });

      await fetchMembers(apId);
    } catch (error) {
      console.error('Initialization error:', error);
      Alert.alert('Error', 'Failed to load members');
      setLoading(false);
    }
  };

  const fetchMembers = async (apId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();

      const response = await fetch(
        buildApiUrl(`/api/mobile-api/user/members?apartmentId=${apId}`),
        {
          method: 'GET',
          headers: getApiHeaders(token),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMembers(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch members');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
      Alert.alert('Error', error.message || 'Failed to load members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (apartmentId) {
      fetchMembers(apartmentId);
    }
  }, [apartmentId]);

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (formData.mobileNumber && !/^[0-9]{10}$/.test(formData.mobileNumber.trim())) {
      errors.mobileNumber = 'Mobile number must be 10 digits';
    }

    if (!formData.relation.trim()) {
      errors.relation = 'Relation is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddMember = () => {
    setEditingMember(null);
    setFormData({ name: '', mobileNumber: '', relation: '' });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      mobileNumber: member.mobileNumber || '',
      relation: member.relation,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const url = editingMember
        ? buildApiUrl('/api/mobile-api/user/members')
        : buildApiUrl('/api/mobile-api/user/members');

      const body = editingMember
        ? { memberId: editingMember.id, ...formData }
        : { apartmentId, ...formData };

      const response = await fetch(url, {
        method: editingMember ? 'PUT' : 'POST',
        headers: getApiHeaders(token),
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert(
          'Success',
          editingMember ? 'Member updated successfully' : 'Member added successfully',
          [
            {
              text: 'OK',
              onPress: () => {
                setShowAddModal(false);
                fetchMembers(apartmentId);
              },
            },
          ]
        );
      } else {
        throw new Error(data.error || 'Failed to save member');
      }
    } catch (error) {
      console.error('Error saving member:', error);
      Alert.alert('Error', error.message || 'Failed to save member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = (member) => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to remove ${member.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch(
                buildApiUrl(`/api/mobile-api/user/members?memberId=${member.id}`),
                {
                  method: 'DELETE',
                  headers: getApiHeaders(token),
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Member deleted successfully');
                fetchMembers(apartmentId);
              } else {
                throw new Error(data.error || 'Failed to delete member');
              }
            } catch (error) {
              console.error('Error deleting member:', error);
              Alert.alert('Error', error.message || 'Failed to delete member');
            }
          },
        },
      ]
    );
  };

  const renderMemberCard = ({ item }) => (
    <TouchableOpacity
      style={styles.memberCard}
      activeOpacity={0.7}
      onPress={() => handleEditMember(item)}
    >
      <LinearGradient
        colors={['rgba(59, 130, 246, 0.05)', 'rgba(139, 92, 246, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.memberCardGradient}
      >
        {/* Avatar */}
        <View style={styles.memberAvatar}>
          <LinearGradient
            colors={[colors.primary.blue, colors.primary.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarGradient}
          >
            <Text style={styles.avatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </LinearGradient>

          {/* Verification Badge */}
          {item.isVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color={colors.status.success} />
            </View>
          )}
        </View>

        {/* Member Info */}
        <View style={styles.memberInfo}>
          <View style={styles.memberHeader}>
            <Text style={styles.memberName}>{item.name}</Text>
            {!item.isVerified && (
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingText}>Pending</Text>
              </View>
            )}
          </View>

          <View style={styles.memberDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="people-outline" size={14} color={colors.text.tertiary} />
              <Text style={styles.detailText}>{item.relation}</Text>
            </View>

            {item.mobileNumber && (
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={14} color={colors.text.tertiary} />
                <Text style={styles.detailText}>{item.mobileNumber}</Text>
              </View>
            )}
          </View>

          <Text style={styles.memberDate}>
            Added {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.memberActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditMember(item)}
          >
            <Ionicons name="create-outline" size={20} color={colors.primary.blue} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteMember(item)}
          >
            <Ionicons name="trash-outline" size={20} color={colors.status.error} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[colors.primaryShades.blue50, colors.primaryShades.purple50]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyIconContainer}
      >
        <Ionicons name="people-outline" size={64} color={colors.primary.blue} />
      </LinearGradient>

      <Text style={styles.emptyTitle}>No Members Yet</Text>
      <Text style={styles.emptySubtitle}>
        Add family members and residents to manage access
      </Text>

      <TouchableOpacity style={styles.emptyButton} onPress={handleAddMember}>
        <LinearGradient
          colors={[colors.primary.blue, colors.primary.purple]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.emptyButtonGradient}
        >
          <Ionicons name="add" size={20} color={colors.neutral.white} />
          <Text style={styles.emptyButtonText}>Add First Member</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.blue} />
          <Text style={styles.loadingText}>Loading members...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Members</Text>
          {apartmentInfo && (
            <Text style={styles.headerSubtitle}>
              {apartmentInfo.tower && `${apartmentInfo.tower} - `}
              {apartmentInfo.number}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddMember}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[colors.primary.blue, colors.primary.purple]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="add" size={24} color={colors.neutral.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{members.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.status.success }]}>
            {members.filter(m => m.isVerified).length}
          </Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.status.warning }]}>
            {members.filter(m => !m.isVerified).length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Members List */}
      <FlatList
        data={members}
        renderItem={renderMemberCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          members.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.blue}
            colors={[colors.primary.blue]}
          />
        }
      />

      {/* Add/Edit Member Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingMember ? 'Edit Member' : 'Add Member'}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Ionicons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>

              {/* Form */}
              <View style={styles.formContainer}>
                {/* Name */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Name *</Text>
                  <TextInput
                    style={[styles.formInput, formErrors.name && styles.formInputError]}
                    placeholder="Enter member name"
                    placeholderTextColor={colors.text.placeholder}
                    value={formData.name}
                    onChangeText={(text) => setFormData({ ...formData, name: text })}
                  />
                  {formErrors.name && (
                    <Text style={styles.errorText}>{formErrors.name}</Text>
                  )}
                </View>

                {/* Mobile Number */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Mobile Number</Text>
                  <TextInput
                    style={[styles.formInput, formErrors.mobileNumber && styles.formInputError]}
                    placeholder="Enter 10-digit mobile number"
                    placeholderTextColor={colors.text.placeholder}
                    value={formData.mobileNumber}
                    onChangeText={(text) => setFormData({ ...formData, mobileNumber: text })}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                  {formErrors.mobileNumber && (
                    <Text style={styles.errorText}>{formErrors.mobileNumber}</Text>
                  )}
                </View>

                {/* Relation */}
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Relation *</Text>
                  <View style={styles.relationButtons}>
                    {['Father', 'Mother', 'Son', 'Daughter', 'Spouse', 'Other'].map((rel) => (
                      <TouchableOpacity
                        key={rel}
                        style={[
                          styles.relationButton,
                          formData.relation === rel && styles.relationButtonActive,
                        ]}
                        onPress={() => setFormData({ ...formData, relation: rel })}
                      >
                        <Text
                          style={[
                            styles.relationButtonText,
                            formData.relation === rel && styles.relationButtonTextActive,
                          ]}
                        >
                          {rel}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  {formData.relation === 'Other' && (
                    <TextInput
                      style={[styles.formInput, { marginTop: spacing.sm }]}
                      placeholder="Specify relation"
                      placeholderTextColor={colors.text.placeholder}
                      value={formData.relation !== 'Other' ? formData.relation : ''}
                      onChangeText={(text) => setFormData({ ...formData, relation: text })}
                    />
                  )}
                  {formErrors.relation && (
                    <Text style={styles.errorText}>{formErrors.relation}</Text>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmit}
                  disabled={submitting}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[colors.primary.blue, colors.primary.purple]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.submitButtonGradient}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.neutral.white} />
                    ) : (
                      <>
                        <Ionicons
                          name={editingMember ? 'checkmark' : 'add'}
                          size={20}
                          color={colors.neutral.white}
                        />
                        <Text style={styles.submitButtonText}>
                          {editingMember ? 'Update Member' : 'Add Member'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
    ...shadows.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  addButton: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    ...shadows.md,
  },
  addButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.primary.blue,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.medium,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.sm,
  },

  // List
  listContent: {
    padding: spacing.lg,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },

  // Member Card
  memberCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  memberCardGradient: {
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  memberAvatar: {
    position: 'relative',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.neutral.white,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.full,
    padding: 2,
  },
  memberInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  memberName: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: colors.status.warningLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  pendingText: {
    fontSize: typography.sizes.xxs,
    fontFamily: typography.fonts.semibold,
    color: colors.status.warning,
  },
  memberDetails: {
    marginBottom: spacing.xs,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  detailText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
  },
  memberDate: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.text.tertiary,
  },
  memberActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
  },
  emptyButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.lg,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyButtonText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral.white,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.modal,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xxxl,
    borderTopRightRadius: borderRadius.xxxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    paddingHorizontal: spacing.xl,
    maxHeight: '90%',
    ...shadows.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fonts.bold,
    color: colors.text.primary,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral.gray50,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  formContainer: {
    gap: spacing.lg,
  },
  formGroup: {
    marginBottom: spacing.base,
  },
  formLabel: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  formInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    fontSize: typography.sizes.md,
    fontFamily: typography.fonts.regular,
    color: colors.text.primary,
  },
  formInputError: {
    borderColor: colors.border.error,
    backgroundColor: colors.status.errorLight,
  },
  errorText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fonts.regular,
    color: colors.status.error,
    marginTop: spacing.xs,
  },
  relationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  relationButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.neutral.gray50,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  relationButtonActive: {
    backgroundColor: colors.primaryShades.blue50,
    borderColor: colors.primary.blue,
  },
  relationButtonText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
    color: colors.text.secondary,
  },
  relationButtonTextActive: {
    color: colors.primary.blue,
    fontFamily: typography.fonts.semibold,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
    ...shadows.lg,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.base,
    gap: spacing.sm,
  },
  submitButtonText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
    color: colors.neutral.white,
  },
});
