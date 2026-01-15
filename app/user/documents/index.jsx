import { Toast } from '@/components/RoomsManagementUI/Toast';
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import { API_ENDPOINTS, buildApiUrl, PHOTO_CONFIG } from '@/config/apiConfig';
import { getAuthToken } from '@/services/authService';
import theme from '@/theme';
import * as DocumentPicker from 'expo-document-picker';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    ActivityIndicator,
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    FileText,
    Plus,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    Upload,
    User,
    X,
    XCircle
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
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
} from 'react-native';


// ============================================
// DOCUMENT TYPES
// ============================================
const DOCUMENT_TYPES = [
  'Rental Agreement',
  'Identity Proof',
  'Police Verification',
  'Income Proof',
  'Bank Statement',
  'Previous Rental Agreement',
  'Utility Bill',
  'Other',
];

// ============================================
// MAIN COMPONENT
// ============================================
const DocumentsManagementUI = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sessionId = params.sessionId;

  // Data state
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userRole, setUserRole] = useState(null); // 'owner' or 'tenant'

  // UI state
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  // Upload form
  const [documentType, setDocumentType] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [documentNotes, setDocumentNotes] = useState('');
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch documents from API
  const fetchDocuments = useCallback(async (showLoader = true) => {
    if (!sessionId) {
      showToast('Session ID is required', 'error');
      setLoading(false);
      return;
    }

    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to view documents', 'error');
        return;
      }

      const url = `${buildApiUrl(API_ENDPOINTS.RENT_SESSION_DOCUMENTS_LIST(sessionId))}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDocuments(data.documents || []);
        setUserRole(data.userRole);
      } else {
        showToast(data.error || 'Failed to fetch documents', 'error');
      }
    } catch (error) {
      console.error('Fetch documents error:', error);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDocuments(false);
  }, [fetchDocuments]);

  // Load data on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDocumentFile(result.assets[0]);
        showToast('Document selected', 'success');
      }
    } catch (error) {
      showToast('Failed to pick document', 'error');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission to access camera denied', 'error');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setDocumentFile({
        uri: result.assets[0].uri,
        name: `document_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: 0,
      });
      showToast('Photo captured', 'success');
    }
  };

  const handleUploadDocument = async () => {
    if (!documentType) {
      showToast('Please select document type', 'error');
      return;
    }
    if (!documentFile) {
      showToast('Please select a document file', 'error');
      return;
    }
    if (!sessionId) {
      showToast('Session ID is required', 'error');
      return;
    }

    try {
      setUploading(true);

      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to upload', 'error');
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append('sessionId', sessionId);
      formData.append('documentType', documentType);
      formData.append('notes', documentNotes);
      formData.append('file', {
        uri: documentFile.uri,
        type: documentFile.type || 'application/pdf',
        name: documentFile.name,
      });

      const response = await fetch(buildApiUrl(API_ENDPOINTS.RENT_SESSION_DOCUMENTS), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message || 'Document uploaded successfully!', 'success');
        setDocumentType('');
        setDocumentFile(null);
        setDocumentNotes('');
        setUploadModalVisible(false);
        fetchDocuments(false); // Refresh list
      } else {
        showToast(data.error || 'Failed to upload document', 'error');
      }
    } catch (error) {
      console.error('Upload document error:', error);
      showToast('Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleApproveDocument = async (docId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to approve', 'error');
        return;
      }

      const response = await fetch(
        `${buildApiUrl(API_ENDPOINTS.RENT_SESSION_DOCUMENTS)}/${docId}`,
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
        showToast('Document approved successfully', 'success');
        fetchDocuments(false); // Refresh list
      } else {
        showToast(data.error || 'Failed to approve document', 'error');
      }
    } catch (error) {
      console.error('Approve document error:', error);
      showToast('Failed to approve document', 'error');
    }
  };

  const handleRejectDocument = async (docId, reason) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to reject', 'error');
        return;
      }

      const response = await fetch(
        `${buildApiUrl(API_ENDPOINTS.RENT_SESSION_DOCUMENTS)}/${docId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rejectionReason: reason || 'Document does not meet requirements',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast('Document rejected', 'success');
        fetchDocuments(false); // Refresh list
      } else {
        showToast(data.error || 'Failed to reject document', 'error');
      }
    } catch (error) {
      console.error('Reject document error:', error);
      showToast('Failed to reject document', 'error');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to delete', 'error');
        return;
      }

      const response = await fetch(
        `${buildApiUrl(API_ENDPOINTS.RENT_SESSION_DOCUMENTS)}/${docId}`,
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
        showToast('Document deleted', 'success');
        setViewModalVisible(false);
        fetchDocuments(false); // Refresh list
      } else {
        showToast(data.error || 'Failed to delete document', 'error');
      }
    } catch (error) {
      console.error('Delete document error:', error);
      showToast('Failed to delete document', 'error');
    }
  };

  const handleViewDocument = (doc) => {
    setSelectedDocument(doc);
    setViewModalVisible(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'approved':
        return {
          color: theme.colors.status.success,
          bgColor: theme.colors.status.successLight,
          label: 'Approved',
          icon: CheckCircle,
        };
      case 'pending':
        return {
          color: theme.colors.status.warning,
          bgColor: theme.colors.status.warningLight,
          label: 'Pending',
          icon: Clock,
        };
      case 'rejected':
        return {
          color: theme.colors.status.error,
          bgColor: theme.colors.status.errorLight,
          label: 'Rejected',
          icon: XCircle,
        };
      default:
        return {
          color: theme.colors.neutral.gray500,
          bgColor: theme.colors.neutral.gray100,
          label: 'Unknown',
          icon: AlertCircle,
        };
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    if (selectedFilter !== 'all') {
      filtered = filtered.filter((d) => d.approvalStatus === selectedFilter);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (d) =>
          d.documentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.documentFilename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatsData = () => {
    return {
      total: documents.length,
      approved: documents.filter((d) => d.approvalStatus === 'approved').length,
      pending: documents.filter((d) => d.approvalStatus === 'pending').length,
      rejected: documents.filter((d) => d.approvalStatus === 'rejected').length,
    };
  };

  const stats = getStatsData();

  const renderDocumentCard = ({ item }) => {
    const statusConfig = getStatusConfig(item.approvalStatus);
    const StatusIcon = statusConfig.icon;
    const isImage = item.thumbnail || item.documentFilename.match(/\.(jpg|jpeg|png|gif)$/i);

    return (
      <TouchableOpacity
        style={styles.documentCard}
        onPress={() => handleViewDocument(item)}
        activeOpacity={0.7}
      >
        <View style={styles.documentCardHeader}>
          <View style={styles.documentIconContainer}>
            {isImage && item.thumbnail ? (
              <Image
                source={{ uri: item.thumbnail }}
                style={styles.documentThumbnail}
                contentFit="cover"
              />
            ) : (
              <FileText size={24} color={theme.colors.primary.blue} />
            )}
          </View>

          <View style={styles.documentInfo}>
            <Text style={styles.documentType}>{item.documentType}</Text>
            <Text style={styles.documentFilename} numberOfLines={1}>
              {item.documentFilename}
            </Text>
            <Text style={styles.documentSize}>{item.fileSize}</Text>
          </View>

          <View
            style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}
          >
            <StatusIcon size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.documentCardFooter}>
          <View style={styles.documentMeta}>
            <User size={14} color={theme.colors.text.tertiary} />
            <Text style={styles.metaText}>
              {item.uploaderName} • {formatDate(item.uploadedAt)}
            </Text>
          </View>

          {item.approvalStatus === 'pending' && userRole === 'owner' && (
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.approveButton}
                onPress={() => handleApproveDocument(item.id)}
              >
                <CheckCircle size={16} color={theme.colors.status.success} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => handleRejectDocument(item.id)}
              >
                <XCircle size={16} color={theme.colors.status.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {item.approvalStatus === 'approved' && item.approvedBy && (
          <View style={styles.approvalBanner}>
            <Shield size={14} color={theme.colors.status.success} />
            <Text style={styles.approvalText}>
              Approved by {item.approvedBy} on {formatDate(item.approvedAt)}
            </Text>
          </View>
        )}

        {item.approvalStatus === 'rejected' && item.rejectionReason && (
          <View style={styles.rejectionBanner}>
            <AlertCircle size={14} color={theme.colors.status.error} />
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>My Documents</Text>
            <Text style={styles.headerSubtitle}>{stats.total} documents</Text>
          </View>
        </View>

        {/* Stats Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <View style={[styles.statCard, styles.statCardTotal]}>
            <FileText size={20} color={theme.colors.primary.blue} />
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, styles.statCardApproved]}>
            <CheckCircle size={20} color={theme.colors.status.success} />
            <Text style={styles.statValue}>{stats.approved}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, styles.statCardPending]}>
            <Clock size={20} color={theme.colors.status.warning} />
            <Text style={styles.statValue}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, styles.statCardRejected]}>
            <XCircle size={20} color={theme.colors.status.error} />
            <Text style={styles.statValue}>{stats.rejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search documents..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.text.placeholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {['all', 'approved', 'pending', 'rejected'].map((filter) => (
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
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Documents List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.blue} />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : (
          <FlatList
            data={filterDocuments()}
            renderItem={renderDocumentCard}
            keyExtractor={(item) => `document-${item.id}`}
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
                <FileText size={48} color={theme.colors.neutral.gray400} />
                <Text style={styles.emptyStateText}>No documents found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {!sessionId
                    ? 'Please select a rent session'
                    : 'Upload a document to get started'}
                </Text>
              </View>
            }
          />
        )}

        {/* Upload FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setUploadModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Upload Modal */}
        <Modal
          visible={uploadModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setUploadModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Upload Document</Text>
                <TouchableOpacity
                  onPress={() => setUploadModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Document Type */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document Type *</Text>
                  <TouchableOpacity
                    style={styles.documentTypeButton}
                    onPress={() => setTypeModalVisible(true)}
                    activeOpacity={0.7}
                  >
                    <FileText size={20} color={theme.colors.text.tertiary} />
                    <Text
                      style={[
                        styles.documentTypeText,
                        !documentType && styles.documentTypePlaceholder,
                      ]}
                    >
                      {documentType || 'Select document type'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* File Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Document File *</Text>

                  {documentFile ? (
                    <View style={styles.filePreviewContainer}>
                      <View style={styles.filePreview}>
                        <FileText size={24} color={theme.colors.primary.blue} />
                        <View style={styles.fileInfo}>
                          <Text style={styles.fileName} numberOfLines={1}>
                            {documentFile.name}
                          </Text>
                          <Text style={styles.fileSize}>
                            {documentFile.size ? `${(documentFile.size / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.removeFileButton}
                        onPress={() => setDocumentFile(null)}
                      >
                        <X size={20} color={theme.colors.status.error} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.filePickerContainer}>
                      <TouchableOpacity
                        style={styles.filePickerButton}
                        onPress={handlePickDocument}
                        activeOpacity={0.7}
                      >
                        <Upload size={24} color={theme.colors.primary.blue} />
                        <Text style={styles.filePickerText}>
                          Choose File
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.filePickerButton}
                        onPress={handleTakePhoto}
                        activeOpacity={0.7}
                      >
                        <Upload size={24} color={theme.colors.primary.blue} />
                        <Text style={styles.filePickerText}>Take Photo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Notes */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Notes (Optional)</Text>
                  <TextInput
                    style={styles.textArea}
                    placeholder="Add any additional notes..."
                    value={documentNotes}
                    onChangeText={setDocumentNotes}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    placeholderTextColor={theme.colors.text.placeholder}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
                  onPress={handleUploadDocument}
                  activeOpacity={0.7}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Upload size={20} color="#FFFFFF" />
                  )}
                  <Text style={styles.submitButtonText}>
                    {uploading ? 'Uploading...' : 'Upload Document'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Document Type Selection Modal */}
        <Modal
          visible={typeModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setTypeModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.typeModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Document Type</Text>
                <TouchableOpacity
                  onPress={() => setTypeModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {DOCUMENT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      documentType === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => {
                      setDocumentType(type);
                      setTypeModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <FileText size={20} color={theme.colors.primary.blue} />
                    <Text style={styles.typeOptionText}>{type}</Text>
                    {documentType === type && (
                      <CheckCircle size={20} color={theme.colors.primary.blue} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* View Document Modal */}
        {selectedDocument && (
          <Modal
            visible={viewModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setViewModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.viewModalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Document Details</Text>
                  <TouchableOpacity
                    onPress={() => setViewModalVisible(false)}
                    style={styles.closeButton}
                  >
                    <X size={24} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  {/* Document Preview */}
                  <View style={styles.previewContainer}>
                    {selectedDocument.thumbnail ? (
                      <Image
                        source={{ uri: selectedDocument.thumbnail }}
                        style={styles.previewImage}
                        contentFit="cover"
                      />
                    ) : (
                      <View style={styles.previewPlaceholder}>
                        <FileText size={64} color={theme.colors.neutral.gray400} />
                        <Text style={styles.previewPlaceholderText}>
                          {selectedDocument.documentFilename}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Document Info */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Document Type:</Text>
                      <Text style={styles.infoValue}>{selectedDocument.documentType}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>File Name:</Text>
                      <Text style={styles.infoValue}>{selectedDocument.documentFilename}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>File Size:</Text>
                      <Text style={styles.infoValue}>{selectedDocument.fileSize}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Uploaded By:</Text>
                      <Text style={styles.infoValue}>{selectedDocument.uploaderName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Upload Date:</Text>
                      <Text style={styles.infoValue}>
                        {formatDate(selectedDocument.uploadedAt)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <View
                        style={[
                          styles.infoStatusBadge,
                          {
                            backgroundColor: getStatusConfig(
                              selectedDocument.approvalStatus
                            ).bgColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.infoStatusText,
                            {
                              color: getStatusConfig(selectedDocument.approvalStatus)
                                .color,
                            },
                          ]}
                        >
                          {getStatusConfig(selectedDocument.approvalStatus).label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.viewActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => console.log('Download')}
                    >
                      <Download size={20} color={theme.colors.primary.blue} />
                      <Text style={styles.actionButtonText}>Download</Text>
                    </TouchableOpacity>

                    {selectedDocument.uploadedBy === userRole && (
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteDocument(selectedDocument.id)}
                      >
                        <Trash2 size={20} color={theme.colors.status.error} />
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Approval Actions (Owner only) */}
                  {selectedDocument.approvalStatus === 'pending' &&
                    userRole === 'owner' && (
                      <View style={styles.approvalActions}>
                        <TouchableOpacity
                          style={styles.approveActionButton}
                          onPress={() => {
                            handleApproveDocument(selectedDocument.id);
                            setViewModalVisible(false);
                          }}
                        >
                          <CheckCircle size={20} color="#FFFFFF" />
                          <Text style={styles.approveActionText}>Approve Document</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectActionButton}
                          onPress={() => {
                            handleRejectDocument(selectedDocument.id);
                            setViewModalVisible(false);
                          }}
                        >
                          <XCircle size={20} color="#FFFFFF" />
                          <Text style={styles.rejectActionText}>Reject Document</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  statsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  statsContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  statCard: {
    minWidth: 100,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  statCardTotal: {
    borderWidth: 2,
    borderColor: theme.colors.primary.blue,
  },
  statCardApproved: {
    borderWidth: 2,
    borderColor: theme.colors.status.success,
  },
  statCardPending: {
    borderWidth: 2,
    borderColor: theme.colors.status.warning,
  },
  statCardRejected: {
    borderWidth: 2,
    borderColor: theme.colors.status.error,
  },
  statValue: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.md,
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
    color: '#FFFFFF',
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.massive,
  },
  documentCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  documentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  documentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  documentThumbnail: {
    width: '100%',
    height: '100%',
  },
  documentInfo: {
    flex: 1,
  },
  documentType: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  documentFilename: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  statusText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
  },
  documentCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    flex: 1,
  },
  metaText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  approveButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.status.successLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: theme.colors.status.errorLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approvalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.successLight,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  approvalText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.status.success,
  },
  rejectionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.errorLight,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  rejectionText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.status.error,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.massive,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
    color: theme.colors.text.placeholder,
    marginTop: theme.spacing.xs,
  },
  fab: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    right: theme.spacing.lg,
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: '90%',
  },
  typeModalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: '70%',
  },
  viewModalContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  documentTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
  },
  documentTypeText: {
    flex: 1,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  documentTypePlaceholder: {
    color: theme.colors.text.placeholder,
  },
  filePickerContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  filePickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
    borderStyle: 'dashed',
  },
  filePickerText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  filePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    padding: theme.spacing.md,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  removeFileButton: {
    padding: theme.spacing.xs,
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
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#FFFFFF',
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  typeOptionSelected: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  typeOptionText: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  previewContainer: {
    marginBottom: theme.spacing.xl,
  },
  previewImage: {
    width: '100%',
    height: 250,
    borderRadius: theme.borderRadius.card,
  },
  previewPlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: theme.borderRadius.card,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  previewPlaceholderText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  infoSection: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    flex: 1,
    textAlign: 'right',
  },
  infoStatusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  infoStatusText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
  },
  viewActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.primaryShades.blue100,
    borderWidth: 1,
    borderColor: theme.colors.primary.blue,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  deleteButton: {
    backgroundColor: theme.colors.status.errorLight,
    borderColor: theme.colors.status.error,
  },
  deleteButtonText: {
    color: theme.colors.status.error,
  },
  approvalActions: {
    gap: theme.spacing.md,
  },
  approveActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.status.success,
  },
  approveActionText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
  rejectActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.status.error,
  },
  rejectActionText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
 
});

export default DocumentsManagementUI;