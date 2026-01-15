// ============================================
// PAGE: Create Post
// Form to create a new community post
// ============================================

import { Toast } from "@/components/RoomsManagementUI/Toast";
import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { API_ENDPOINTS, buildApiUrl, getApiHeaders } from "@/config/apiConfig";
import { useApartment } from "@/providers/ApartmentProvider";
import { getAuthToken, getUserData } from "@/services/authService";
import theme from "@/theme";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { AlertCircle, Image as ImageIcon, Send, X } from "lucide-react-native";

import { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const IMAGE_SIZE = (width - theme.spacing.lg * 2 - theme.spacing.sm * 2) / 3;

const CreatePost = () => {
  const router = useRouter();
  const { currentApartment } = useApartment();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    (async () => {
      const data = await getUserData();
      setUserData(data);
    })();
  }, []);
  const [postText, setPostText] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handlePickImages = async () => {
    if (selectedImages.length >= 10) {
      showToast("Maximum 10 images allowed", "error");
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showToast("Permission to access gallery denied", "error");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 10 - selectedImages.length,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  const handleTakePhoto = async () => {
    if (selectedImages.length >= 10) {
      showToast("Maximum 10 images allowed", "error");
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      showToast("Permission to access camera denied", "error");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImages([...selectedImages, result.assets[0].uri]);
    }
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
    showToast("Image removed", "success");
  };

  const handleCreatePost = async () => {
    try {
      if (!postText.trim() && selectedImages.length === 0) {
        showToast("Please add some text or images", "error");
        return;
      }

      const token = await getAuthToken();

      // 1️⃣ Upload images via PHP (if any)
      let uploadedFiles = [];
      if (selectedImages.length > 0) {
        const formData = new FormData();
        selectedImages.forEach((uri) => {
          formData.append("guestImage[]", {
            uri,
            name: `post_${Date.now()}.jpg`,
            type: "image/jpeg",
          });
        });

        // Optional: attach apartmentId for folder grouping
        if (currentApartment?.id) {
          formData.append("apartmentId", currentApartment.id);
        }

        const uploadResponse = await fetch(
          "https://wowfy.in/gatewise/upload.php",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadResult = await uploadResponse.json();

        if (!uploadResult.success) {
          console.error("❌ Upload failed:", uploadResult);
          showToast(uploadResult.error || "Image upload failed", "error");
          return;
        }

        uploadedFiles = uploadResult.uploadedFiles || [];
        console.log("✅ Uploaded images:", uploadedFiles);
      }

      // 2️⃣ Create community post
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.CREATE_COMMUNITY_POST),
        {
          method: "POST",
          headers: getApiHeaders(token),
          body: JSON.stringify({
            description: postText,
            imageFilenames: uploadedFiles,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        console.error("❌ Create post failed:", result);
        showToast(result.message || "Failed to create post", "error");
        return;
      }

      // 3️⃣ Success
      showToast("Post created successfully!", "success");

      // 4️⃣ Navigate back after short delay
      setTimeout(() => {
        router.back();
      }, 1000);
    } catch (error) {
      console.error("❌ Error creating post:", error);
      showToast("Something went wrong. Please try again.", "error");
    }
  };

  const handleCancel = () => {
    if (postText.trim() || selectedImages.length > 0) {
      // Show confirmation dialog
      showToast("Discarding post...", "info");
    }
    router.back();
  };

  return (
    <SafeAreaWrapper edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.cancelButton}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handleCreatePost}
            style={[
              styles.postButton,
              !postText.trim() &&
                selectedImages.length === 0 &&
                styles.postButtonDisabled,
            ]}
            disabled={!postText.trim() && selectedImages.length === 0}
            activeOpacity={0.7}
          >
            <Send size={18} color="#FFFFFF" />
            <Text style={styles.postButtonText}>Post</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "?"}
              </Text>
            </View>

            <View>
              <Text style={styles.userName}>
                {userData?.name || "Unknown User"}
              </Text>
              <Text style={styles.userApartment}>
                {currentApartment
                  ? `${currentApartment.apartmentNumber || "N/A"}${
                      currentApartment.towerName
                        ? `, ${currentApartment.towerName}`
                        : ""
                    }`
                  : "No Apartment"}
              </Text>
            </View>
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.textInput}
            placeholder="What's on your mind?"
            value={postText}
            onChangeText={setPostText}
            multiline
            textAlignVertical="top"
            maxLength={5000}
            placeholderTextColor={theme.colors.text.placeholder}
            autoFocus
          />

          {/* Character Count */}
          {postText.length > 0 && (
            <View style={styles.characterCountContainer}>
              <Text
                style={[
                  styles.characterCount,
                  postText.length > 4500 && styles.characterCountWarning,
                  postText.length >= 5000 && styles.characterCountError,
                ]}
              >
                {postText.length} / 5000
              </Text>
            </View>
          )}

          {/* Image Preview Grid */}
          {selectedImages.length > 0 && (
            <View style={styles.imagePreviewSection}>
              <View style={styles.imagePreviewHeader}>
                <Text style={styles.imagePreviewTitle}>
                  {selectedImages.length}{" "}
                  {selectedImages.length === 1 ? "photo" : "photos"}
                </Text>
                <Text style={styles.imagePreviewSubtitle}>
                  Maximum 10 photos
                </Text>
              </View>

              <View style={styles.imageGrid}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imagePreviewItem}>
                    <Image
                      source={{ uri }}
                      style={styles.imagePreview}
                      contentFit="cover"
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => handleRemoveImage(index)}
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                    {index < 9 && (
                      <View style={styles.imageIndexBadge}>
                        <Text style={styles.imageIndexText}>{index + 1}</Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Add More Button */}
                {selectedImages.length < 10 && (
                  <TouchableOpacity
                    style={styles.addMoreImageButton}
                    onPress={handlePickImages}
                    activeOpacity={0.7}
                  >
                    <ImageIcon size={32} color={theme.colors.primary.blue} />
                    <Text style={styles.addMoreImageText}>Add {"\n"}More</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <AlertCircle size={16} color={theme.colors.status.info} />
            <Text style={styles.infoBannerText}>
              Your post will be visible to all community members
            </Text>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Actions */}
        {selectedImages.length === 0 && (
          <View style={styles.bottomActions}>
            <Text style={styles.bottomActionsTitle}>Add to your post</Text>
            <View style={styles.bottomActionsButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePickImages}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionButtonIcon,
                    { backgroundColor: theme.colors.primaryShades.blue100 },
                  ]}
                >
                  <ImageIcon size={24} color={theme.colors.primary.blue} />
                </View>
                <Text style={styles.actionButtonText}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.actionButtonIcon,
                    { backgroundColor: theme.colors.primaryShades.purple100 },
                  ]}
                >
                  <ImageIcon size={24} color={theme.colors.primary.purple} />
                </View>
                <Text style={styles.actionButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  cancelButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  cancelButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.button,
  },
  postButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray300,
  },
  postButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  userAvatarText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  userName: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  userApartment: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  textInput: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    lineHeight: 24,
    minHeight: 200,
  },
  characterCountContainer: {
    paddingHorizontal: theme.spacing.lg,
    alignItems: "flex-end",
    marginBottom: theme.spacing.md,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },
  characterCountWarning: {
    color: theme.colors.status.warning,
  },
  characterCountError: {
    color: theme.colors.status.error,
  },
  imagePreviewSection: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  imagePreviewHeader: {
    marginBottom: theme.spacing.md,
  },
  imagePreviewTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  imagePreviewSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  imagePreviewItem: {
    position: "relative",
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.neutral.gray200,
  },
  removeImageButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageIndexBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: theme.borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  imageIndexText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  addMoreImageButton: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: theme.borderRadius.input,
    backgroundColor: theme.colors.primaryShades.blue50,
    borderWidth: 2,
    borderColor: theme.colors.primary.blue,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  addMoreImageText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.infoLight,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.input,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.status.info,
  },
  bottomSpacer: {
    height: theme.spacing.massive,
  },
  bottomActions: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    backgroundColor: theme.colors.background.primary,
  },
  bottomActionsTitle: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  bottomActionsButtons: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
});

export default CreatePost;
