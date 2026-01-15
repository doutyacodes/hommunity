// ============================================
// PAGE: Dispute Chat
// Real-time chat interface for dispute resolution
// ============================================

import { Toast } from "@/components/RoomsManagementUI/Toast";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import theme from "@/theme";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowUp,
  CheckCircle,
  Clock,
  Home,
  Image as ImageIcon,
  MoreVertical,
  Send,
  Shield,
  User,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";

const DisputeChat = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const flatListRef = useRef(null);

  // Data state
  const [disputeDetails, setDisputeDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [resolutionApprovals, setResolutionApprovals] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreviewModal, setImagePreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    // Scroll to bottom on mount and when messages change
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !selectedImage) {
      showToast("Please enter a message or select an image", "error");
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to send messages', 'error');
        return;
      }

      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.DISPUTE_CHAT(params.id)),
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messageText: messageText.trim(),
            imageFilename: selectedImage,
          }),
        }
      );

      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [...prev, json.message]);
        setMessageText("");
        setSelectedImage(null);
      } else {
        showToast(json.error || 'Failed to send message', "error");
      }
    } catch (err) {
      console.error('Send message error:', err);
      showToast("Failed to send message", "error");
    }
  };

  const handleImagePress = (imageUri) => {
    setPreviewImage(imageUri);
    setImagePreviewModal(true);
  };
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDispute();
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleEscalateToAdmin = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to escalate', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.ESCALATE_DISPUTE(params.id)),
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
        showToast("Dispute escalated to admin", "success");
        setMenuVisible(false);
        // Refresh dispute data
        fetchDispute();
      } else {
        showToast(data.error || 'Failed to escalate dispute', 'error');
      }
    } catch (err) {
      console.error('Escalate error:', err);
      showToast("Failed to escalate dispute", "error");
    }
  };

  const fetchDispute = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(
        buildApiUrl(API_ENDPOINTS.DISPUTE_DETAILS(params.id)),
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const json = await res.json();
      if (json.success) {
        setDisputeDetails(json.data.dispute);
        setMessages(json.data.messages || []);
        setResolutionApprovals(json.data.approvals || []);
        setCurrentUser(json.data.currentUser);
      }
    } catch (err) {
      console.error("❌ Dispute fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchDispute();
  }, [params.id]);

  const handleApproveResolution = async () => {
    if (!currentUser) return;

    const hasApproved = resolutionApprovals.some(
      (a) => a.role === currentUser.role
    );

    if (hasApproved) {
      showToast("You have already approved", "info");
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        showToast('Please login to approve', 'error');
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.RESOLVE_DISPUTE(params.id)),
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
        showToast("Resolution approved", "success");
        setMenuVisible(false);
        // Refresh dispute data
        fetchDispute();
      } else {
        showToast(data.error || 'Failed to approve resolution', 'error');
      }
    } catch (err) {
      console.error('Approve resolution error:', err);
      showToast("Failed to approve resolution", "error");
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return theme.colors.status.error;
      case "owner":
        return theme.colors.primary.blue;
      case "tenant":
        return theme.colors.primary.purple;
      default:
        return theme.colors.neutral.gray500;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return Shield;
      case "owner":
        return Home;
      case "tenant":
        return User;
      default:
        return User;
    }
  };

  const isOwnMessage = (message) => {
    return currentUser && message.senderRole === currentUser.role;
  };

  const needsApproval = () => {
    return (
      disputeDetails?.escalatedToAdmin &&
      resolutionApprovals.length < 3 &&
      currentUser &&
      !resolutionApprovals.some((a) => a.role === currentUser.role)
    );
  };

  const renderDateSeparator = (currentMessage, previousMessage) => {
    if (!previousMessage) return formatDate(currentMessage.sentAt);

    const currentDate = new Date(currentMessage.sentAt).toDateString();
    const previousDate = new Date(previousMessage.sentAt).toDateString();

    if (currentDate !== previousDate) {
      return formatDate(currentMessage.sentAt);
    }

    return null;
  };

  const renderMessage = ({ item, index }) => {
    const isOwn = isOwnMessage(item);
    const RoleIcon = getRoleIcon(item.senderRole);
    const roleColor = getRoleColor(item.senderRole);
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const dateSeparator = renderDateSeparator(item, previousMessage);

    return (
      <>
        {dateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{dateSeparator}</Text>
          </View>
        )}

        <View
          style={[
            styles.messageContainer,
            isOwn ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {!isOwn && (
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: roleColor + "20" },
              ]}
            >
              <RoleIcon size={16} color={roleColor} />
            </View>
          )}

          <View
            style={[
              styles.messageBubble,
              isOwn ? styles.ownMessageBubble : styles.otherMessageBubble,
              item.senderRole === "admin" && styles.adminMessageBubble,
            ]}
          >
            {!isOwn && (
              <View style={styles.messageHeader}>
                <Text style={[styles.senderName, { color: roleColor }]}>
                  {item.senderName}
                </Text>
                <Text style={styles.senderRole}>
                  {item.senderRole.charAt(0).toUpperCase() +
                    item.senderRole.slice(1)}
                </Text>
              </View>
            )}

            {item.messageText && (
              <Text
                style={[
                  styles.messageText,
                  isOwn && styles.ownMessageText,
                  item.senderRole === "admin" && styles.adminMessageText,
                ]}
              >
                {item.messageText}
              </Text>
            )}

            {item.imageFilename && (
              <TouchableOpacity
                onPress={() => handleImagePress(item.imageFilename)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: item.imageFilename }}
                  style={styles.messageImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            )}

            <Text
              style={[
                styles.messageTime,
                isOwn && styles.ownMessageTime,
                item.senderRole === "admin" && styles.adminMessageTime,
              ]}
            >
              {formatTime(item.sentAt)}
            </Text>
          </View>

          {isOwn && (
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: roleColor + "20" },
              ]}
            >
              <RoleIcon size={16} color={roleColor} />
            </View>
          )}
        </View>
      </>
    );
  };

  return (
    <SafeAreaWrapper edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={styles.headerTitle}>
                {disputeDetails?.reportType === "room_based"
                  ? disputeDetails?.roomName
                  : "General Dispute"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {disputeDetails?.createdAt && `Created ${formatDate(disputeDetails.createdAt)}`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
          >
            <MoreVertical size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Dispute Info Banner */}
        {disputeDetails?.reason && (
          <View style={styles.infoBanner}>
            <AlertCircle size={16} color={theme.colors.primary.blue} />
            <Text style={styles.infoBannerText}>{disputeDetails.reason}</Text>
          </View>
        )}

        {/* Escalation Banner */}
        {disputeDetails?.escalatedToAdmin && (
          <View style={styles.escalationBanner}>
            <Shield size={16} color={theme.colors.status.error} />
            <Text style={styles.escalationText}>
              Admin has joined the conversation
            </Text>
          </View>
        )}

        {/* Approval Status */}
        {disputeDetails?.escalatedToAdmin && resolutionApprovals.length > 0 && (
          <View style={styles.approvalBanner}>
            <View style={styles.approvalHeader}>
              <CheckCircle size={16} color={theme.colors.status.success} />
              <Text style={styles.approvalTitle}>
                Resolution Approval Status
              </Text>
            </View>
            <View style={styles.approvalList}>
              {["owner", "tenant", "admin"].map((role) => {
                const approved = resolutionApprovals.some(
                  (a) => a.role === role && a.approved
                );
                return (
                  <View key={role} style={styles.approvalItem}>
                    <Text style={styles.approvalRole}>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                    {approved ? (
                      <CheckCircle
                        size={16}
                        color={theme.colors.status.success}
                      />
                    ) : (
                      <Clock size={16} color={theme.colors.status.warning} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => `message-${item.id}`}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.selectedImageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <X size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handlePickImage}
            >
              <ImageIcon size={24} color={theme.colors.primary.blue} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              placeholderTextColor={theme.colors.text.placeholder}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                !messageText.trim() &&
                  !selectedImage &&
                  styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() && !selectedImage}
            >
              <Send size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Preview Modal */}
        <Modal
          visible={imagePreviewModal}
          transparent
          animationType="fade"
          onRequestClose={() => setImagePreviewModal(false)}
        >
          <View style={styles.imagePreviewOverlay}>
            <TouchableOpacity
              style={styles.imagePreviewClose}
              onPress={() => setImagePreviewModal(false)}
            >
              <X size={32} color="#FFFFFF" />
            </TouchableOpacity>
            {previewImage && (
              <Image
                source={{ uri: previewImage }}
                style={styles.imagePreviewFull}
                contentFit="contain"
              />
            )}
          </View>
        </Modal>

        {/* Menu Modal */}
        <Modal
          visible={menuVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setMenuVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.menuContent}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Dispute Actions</Text>
                <TouchableOpacity
                  onPress={() => setMenuVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              {!disputeDetails?.escalatedToAdmin &&
                currentUser?.role !== "admin" && (
                  <TouchableOpacity
                    style={styles.menuOption}
                    onPress={handleEscalateToAdmin}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuOptionIcon,
                        { backgroundColor: theme.colors.status.errorLight },
                      ]}
                    >
                      <ArrowUp size={20} color={theme.colors.status.error} />
                    </View>
                    <View style={styles.menuOptionText}>
                      <Text style={styles.menuOptionTitle}>
                        Escalate to Admin
                      </Text>
                      <Text style={styles.menuOptionSubtitle}>
                        Request admin intervention
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}

              {needsApproval() && (
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleApproveResolution}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuOptionIcon,
                      { backgroundColor: theme.colors.status.successLight },
                    ]}
                  >
                    <CheckCircle
                      size={20}
                      color={theme.colors.status.success}
                    />
                  </View>
                  <View style={styles.menuOptionText}>
                    <Text style={styles.menuOptionTitle}>
                      Approve Resolution
                    </Text>
                    <Text style={styles.menuOptionSubtitle}>
                      Agree to close this dispute
                    </Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.menuOption}
                onPress={() => setMenuVisible(false)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.menuOptionIcon,
                    { backgroundColor: theme.colors.neutral.gray100 },
                  ]}
                >
                  <X size={20} color={theme.colors.neutral.gray700} />
                </View>
                <View style={styles.menuOptionText}>
                  <Text style={styles.menuOptionTitle}>Cancel</Text>
                  <Text style={styles.menuOptionSubtitle}>Close this menu</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
      </KeyboardAvoidingView>
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
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 28,
    color: theme.colors.text.primary,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue50,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  escalationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.errorLight,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  escalationText: {
    flex: 1,
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.error,
  },
  approvalBanner: {
    backgroundColor: theme.colors.status.successLight,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  approvalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  approvalTitle: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.success,
  },
  approvalList: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  approvalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  approvalRole: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  messagesList: {
    padding: theme.spacing.base,
    paddingBottom: theme.spacing.xl,
  },
  dateSeparator: {
    alignItems: "center",
    marginVertical: theme.spacing.md,
  },
  dateSeparatorText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    backgroundColor: theme.colors.background.secondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  ownMessageContainer: {
    justifyContent: "flex-end",
  },
  otherMessageContainer: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "70%",
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
  },
  ownMessageBubble: {
    backgroundColor: theme.colors.primary.blue,
  },
  otherMessageBubble: {
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  adminMessageBubble: {
    backgroundColor: theme.colors.status.errorLight,
    borderColor: theme.colors.status.error,
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  senderName: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.bold,
  },
  senderRole: {
    fontSize: 10,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  ownMessageText: {
    color: "#FFFFFF",
  },
  adminMessageText: {
    color: theme.colors.status.error,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: theme.borderRadius.input,
    marginTop: theme.spacing.sm,
  },
  messageTime: {
    fontSize: 10,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
    textAlign: "right",
  },
  ownMessageTime: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  adminMessageTime: {
    color: theme.colors.status.error,
    opacity: 0.7,
  },
  inputContainer: {
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  selectedImageContainer: {
    position: "relative",
    marginBottom: theme.spacing.sm,
  },
  selectedImage: {
    width: 100,
    height: 80,
    borderRadius: theme.borderRadius.input,
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.error,
    justifyContent: "center",
    alignItems: "center",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
  },
  imageButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.full,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray300,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewClose: {
    position: "absolute",
    top: 60,
    right: theme.spacing.lg,
    zIndex: 1,
  },
  imagePreviewFull: {
    width: "100%",
    height: "100%",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  menuContent: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
  },
  menuHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xl,
  },
  menuTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  menuOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  menuOptionText: {
    flex: 1,
  },
  menuOptionTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  menuOptionSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
});

export default DisputeChat;
