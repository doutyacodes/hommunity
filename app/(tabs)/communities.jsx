// ============================================
// PAGE: Community Posts (Dynamic with API Integration)
// Social feed with posts and Reddit-style comments
// ============================================

import { Toast } from "@/components/RoomsManagementUI/Toast";
import { API_ENDPOINTS, buildApiUrl, PHOTO_CONFIG } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronDown,
  ChevronUp,
  Flag,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCw,
  Send,
  Share2,
  ThumbsUp,
  X
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

const REPORT_TYPES = [
  { id: "spam", label: "Spam or misleading" },
  { id: "harassment", label: "Harassment or bullying" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "violence", label: "Violence or dangerous content" },
  { id: "false_info", label: "False information" },
  { id: "other", label: "Other" },
];

const CommunityPosts = () => {
  const router = useRouter();

  // Posts state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comments state
  const [selectedPost, setSelectedPost] = useState(null);
  const [postComments, setPostComments] = useState([]);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Image viewer
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [initialImageIndex, setInitialImageIndex] = useState(0);

  // Report modal
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch posts
  const fetchPosts = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to view posts", "error");
        return;
      }

      const response = await fetch(
        buildApiUrl(
          API_ENDPOINTS.COMMUNITY_POSTS || "/api/mobile-api/user/community-posts"
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("📥 Posts response:", data);

      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to load posts", "error");
        setPosts([]);
        return;
      }

      // Format image URLs
      const formattedPosts = data.posts.map((post) => ({
        ...post,
        images: post.images.map((img) =>
          img.startsWith("http") ? img : `${PHOTO_CONFIG.BASE_URL}${img}`
        ),
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error("❌ Error fetching posts:", error);
      showToast("Failed to load posts", "error");
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch comments for a post
  const fetchComments = async (postId) => {
    try {
      setLoadingComments(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to view comments", "error");
        return;
      }

      const response = await fetch(
        buildApiUrl(
          `${API_ENDPOINTS.COMMUNITY_COMMENTS || "/api/mobile-api/user/community-posts/comments"}?postId=${postId}`
        ),
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("📥 Comments response:", data);

      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to load comments", "error");
        setPostComments([]);
        return;
      }

      setPostComments(data.comments);
    } catch (error) {
      console.error("❌ Error fetching comments:", error);
      showToast("Failed to load comments", "error");
      setPostComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  // Add comment or reply
  const handleSendComment = async () => {
    if (!commentText.trim()) {
      showToast("Please enter a comment", "error");
      return;
    }

    if (commentText.trim().length > 500) {
      showToast("Comment is too long (max 500 characters)", "error");
      return;
    }

    try {
      setSubmittingComment(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to comment", "error");
        return;
      }

      const payload = {
        postId: selectedPost.id,
        commentText: commentText.trim(),
        parentCommentId: replyingTo?.id || null,
      };

      console.log("📤 Submitting comment:", payload);

      const response = await fetch(
        buildApiUrl(
          API_ENDPOINTS.COMMUNITY_COMMENTS ||
            "/api/mobile-api/user/community-posts/comments"
        ),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("📥 Comment response:", data);

      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to add comment", "error");
        return;
      }

      showToast(data.message || "Comment added successfully", "success");
      setCommentText("");
      setReplyingTo(null);

      // Refresh comments
      await fetchComments(selectedPost.id);

      // Update post comment count
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === selectedPost.id
            ? { ...post, commentCount: post.commentCount + 1 }
            : post
        )
      );

      // Update selected post
      setSelectedPost((prev) => ({
        ...prev,
        commentCount: prev.commentCount + 1,
      }));
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      showToast("Failed to add comment", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Delete post
  const handleDeletePost = async (postId) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await getAuthToken();
              if (!token) {
                showToast("Please login", "error");
                return;
              }

              const response = await fetch(
                buildApiUrl(
                  `${API_ENDPOINTS.COMMUNITY_POSTS || "/api/mobile-api/user/community-posts"}?postId=${postId}`
                ),
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                }
              );

              const data = await response.json();

              if (!response.ok || !data.success) {
                showToast(data.message || "Failed to delete post", "error");
                return;
              }

              showToast("Post deleted successfully", "success");
              // Remove post from list
              setPosts((prevPosts) =>
                prevPosts.filter((post) => post.id !== postId)
              );
            } catch (error) {
              console.error("❌ Error deleting post:", error);
              showToast("Failed to delete post", "error");
            }
          },
        },
      ]
    );
  };

  // Report post
  const handleSubmitReport = async () => {
    if (!selectedReportType) {
      showToast("Please select a reason", "error");
      return;
    }

    try {
      setSubmittingReport(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login", "error");
        return;
      }

      const payload = {
        postId: selectedPost.id,
        reportType: selectedReportType,
        reportReason: reportReason.trim() || null,
      };

      console.log("📤 Submitting report:", payload);

      const response = await fetch(
        buildApiUrl(
          API_ENDPOINTS.COMMUNITY_REPORT ||
            "/api/mobile-api/user/community-posts/report"
        ),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(data.message || "Failed to submit report", "error");
        return;
      }

      showToast(data.message || "Report submitted successfully", "success");
      setReportModalVisible(false);
      setSelectedReportType(null);
      setReportReason("");
    } catch (error) {
      console.error("❌ Error submitting report:", error);
      showToast("Failed to submit report", "error");
    } finally {
      setSubmittingReport(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts(false);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const handleLikePost = async (postId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to like posts", "error");
        return;
      }

      // Optimistic update
      const post = posts.find(p => p.id === postId);
      const wasLiked = post?.isLiked;

      setPosts(
        posts.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likeCount: post.isLiked
                  ? post.likeCount - 1
                  : post.likeCount + 1,
              }
            : post
        )
      );

      // Make API call
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.LIKE_POST),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ postId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Revert on error
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: wasLiked,
                  likeCount: wasLiked ? post.likeCount + 1 : post.likeCount - 1,
                }
              : post
          )
        );
        showToast(data.message || "Failed to like post", "error");
      }
    } catch (error) {
      console.error("❌ Error liking post:", error);
      showToast("Failed to like post", "error");
    }
  };

  const handleLikeComment = async (commentId, isReply = false) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to like comments", "error");
        return;
      }

      // Find the comment to get its current like state
      let wasLiked = false;

      if (isReply) {
        for (const c of postComments) {
          const reply = c.replies?.find(r => r.id === commentId);
          if (reply) {
            wasLiked = reply.isLiked;
            break;
          }
        }
      } else {
        const comment = postComments.find(c => c.id === commentId);
        wasLiked = comment?.isLiked;
      }

      // Optimistic update
      setPostComments((prevComments) =>
        prevComments.map((comment) => {
          if (isReply) {
            return {
              ...comment,
              replies: comment.replies.map((reply) =>
                reply.id === commentId
                  ? {
                      ...reply,
                      isLiked: !reply.isLiked,
                      likeCount: reply.isLiked
                        ? reply.likeCount - 1
                        : reply.likeCount + 1,
                    }
                  : reply
              ),
            };
          }
          if (comment.id === commentId) {
            return {
              ...comment,
              isLiked: !comment.isLiked,
              likeCount: comment.isLiked
                ? comment.likeCount - 1
                : comment.likeCount + 1,
            };
          }
          return comment;
        })
      );

      // Make API call
      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.LIKE_COMMENT),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ commentId }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Revert on error
        setPostComments((prevComments) =>
          prevComments.map((comment) => {
            if (isReply) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === commentId
                    ? {
                        ...reply,
                        isLiked: wasLiked,
                        likeCount: wasLiked ? reply.likeCount + 1 : reply.likeCount - 1,
                      }
                    : reply
                ),
              };
            }
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: wasLiked,
                likeCount: wasLiked ? comment.likeCount + 1 : comment.likeCount - 1,
              };
            }
            return comment;
          })
        );
        showToast(data.message || "Failed to like comment", "error");
      }
    } catch (error) {
      console.error("❌ Error liking comment:", error);
      showToast("Failed to like comment", "error");
    }
  };

  const handleOpenComments = async (post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
    await fetchComments(post.id);
  };

  const handleOpenImageViewer = (images, index = 0) => {
    setSelectedImages(images);
    setInitialImageIndex(index);
    setImageViewerVisible(true);
  };

  const handleOpenReportModal = (post) => {
    setSelectedPost(post);
    setReportModalVisible(true);
  };

  const toggleCommentExpand = (commentId) => {
    setExpandedComments({
      ...expandedComments,
      [commentId]: !expandedComments[commentId],
    });
  };

  const buildImageUrl = (filename) => {
    if (!filename) return null;
    if (filename.startsWith("http")) return filename;
    return `${PHOTO_CONFIG.BASE_URL}${filename}`;
  };

  const renderImageGallery = (images) => {
    if (images.length === 0) return null;

    if (images.length === 1) {
      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleOpenImageViewer(images, 0)}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.singleImage}
            contentFit="cover"
          />
        </TouchableOpacity>
      );
    }

    if (images.length === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          {images.map((img, idx) => (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.9}
              onPress={() => handleOpenImageViewer(images, idx)}
            >
              <Image
                source={{ uri: img }}
                style={styles.halfImage}
                contentFit="cover"
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    // 3 or more images
    return (
      <View style={styles.multiImageContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => handleOpenImageViewer(images, 0)}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.mainImage}
            contentFit="cover"
          />
        </TouchableOpacity>
        <View style={styles.sideImages}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleOpenImageViewer(images, 1)}
          >
            <Image
              source={{ uri: images[1] }}
              style={styles.sideImage}
              contentFit="cover"
            />
          </TouchableOpacity>
          {images.length > 2 && (
            <TouchableOpacity
              style={styles.moreImagesContainer}
              activeOpacity={0.9}
              onPress={() => handleOpenImageViewer(images, 2)}
            >
              <Image
                source={{ uri: images[2] }}
                style={styles.sideImage}
                contentFit="cover"
              />
              {images.length > 3 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>
                    +{images.length - 3}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderComment = (comment, isReply = false) => {
    const isExpanded = expandedComments[comment.id];
    const hasReplies = comment.replies && comment.replies.length > 0;

    return (
      <View
        key={`${isReply ? "reply" : "comment"}-${comment.id}`}
        style={[styles.commentContainer, isReply && styles.replyContainer]}
      >
        <View style={styles.commentVoteLine}>
          <View style={styles.voteLine} />
        </View>

        <View style={styles.commentContent}>
          <View style={styles.commentHeader}>
            <View style={styles.commentAvatar}>
              <Text style={styles.commentAvatarText}>
                {comment.userName.charAt(0)}
              </Text>
            </View>
            <View style={styles.commentMeta}>
              <Text style={styles.commentUserName}>{comment.userName}</Text>
              <Text style={styles.commentApartment}>
                {comment.userApartment}
              </Text>
            </View>
            <Text style={styles.commentTime}>
              {formatTime(comment.createdAt)}
            </Text>
          </View>

          <Text style={styles.commentText}>{comment.commentText}</Text>

          <View style={styles.commentActions}>
            <TouchableOpacity
              style={styles.commentAction}
              onPress={() => handleLikeComment(comment.id, isReply)}
              activeOpacity={0.7}
            >
              <ThumbsUp
                size={14}
                color={
                  comment.isLiked
                    ? theme.colors.primary.blue
                    : theme.colors.text.tertiary
                }
                fill={comment.isLiked ? theme.colors.primary.blue : "none"}
              />
              <Text
                style={[
                  styles.commentActionText,
                  comment.isLiked && styles.commentActionTextActive,
                ]}
              >
                {comment.likeCount}
              </Text>
            </TouchableOpacity>

            {!isReply && (
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => setReplyingTo(comment)}
                activeOpacity={0.7}
              >
                <MessageSquare size={14} color={theme.colors.text.tertiary} />
                <Text style={styles.commentActionText}>Reply</Text>
              </TouchableOpacity>
            )}

            {hasReplies && (
              <TouchableOpacity
                style={styles.commentAction}
                onPress={() => toggleCommentExpand(comment.id)}
                activeOpacity={0.7}
              >
                {isExpanded ? (
                  <ChevronUp size={14} color={theme.colors.text.tertiary} />
                ) : (
                  <ChevronDown size={14} color={theme.colors.text.tertiary} />
                )}
                <Text style={styles.commentActionText}>
                  {comment.replies.length}{" "}
                  {comment.replies.length === 1 ? "reply" : "replies"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {hasReplies && isExpanded && (
            <View style={styles.repliesContainer}>
              {comment.replies.map((reply) => renderComment(reply, true))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPost = ({ item }) => {
    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <View style={styles.postAvatar}>
              <Text style={styles.postAvatarText}>
                {item.userName.charAt(0)}
              </Text>
            </View>
            <View>
              <Text style={styles.postUserName}>{item.userName}</Text>
              <Text style={styles.postApartment}>{item.userApartment}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.postMenuButton}
            onPress={() => {
              Alert.alert("Post Actions", "Choose an action", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Post",
                  style: "destructive",
                  onPress: () => handleDeletePost(item.id),
                },
                {
                  text: "Report Post",
                  onPress: () => handleOpenReportModal(item),
                },
              ]);
            }}
          >
            <MoreVertical size={20} color={theme.colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Post Content */}
        <Text style={styles.postText}>{item.postText}</Text>

        {/* Post Images */}
        {renderImageGallery(item.images)}

        {/* Post Footer */}
        <View style={styles.postFooter}>
          <View style={styles.postStats}>
            <Text style={styles.postStatsText}>
              {item.likeCount} {item.likeCount === 1 ? "like" : "likes"}
            </Text>
            <Text style={styles.postStatsText}>
              {item.commentCount}{" "}
              {item.commentCount === 1 ? "comment" : "comments"}
            </Text>
          </View>
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity
            style={styles.postAction}
            onPress={() => handleLikePost(item.id)}
            activeOpacity={0.7}
          >
            <ThumbsUp
              size={20}
              color={
                item.isLiked
                  ? theme.colors.primary.blue
                  : theme.colors.text.tertiary
              }
              fill={item.isLiked ? theme.colors.primary.blue : "none"}
            />
            <Text
              style={[
                styles.postActionText,
                item.isLiked && styles.postActionTextActive,
              ]}
            >
              Like
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.postAction}
            onPress={() => handleOpenComments(item)}
            activeOpacity={0.7}
          >
            <MessageSquare size={20} color={theme.colors.text.tertiary} />
            <Text style={styles.postActionText}>Comment</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.postAction} activeOpacity={0.7}>
            <Share2 size={20} color={theme.colors.text.tertiary} />
            <Text style={styles.postActionText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Post Time */}
        <Text style={styles.postTime}>{formatTime(item.createdAt)}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
          <Text style={styles.loadingText}>Loading posts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
          <RefreshCw size={20} color={theme.colors.primary.blue} />
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      {posts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MessageSquare size={64} color={theme.colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No Posts Yet</Text>
          <Text style={styles.emptySubtitle}>
            Be the first to share something with your community!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push("/community/create-post")}
            activeOpacity={0.7}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => `post-${item.id}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Create Post FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/community/create-post")}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Comments Modal */}
      <Modal
        visible={commentsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setCommentsModalVisible(false);
          setReplyingTo(null);
          setCommentText("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.commentsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Comments ({selectedPost?.commentCount || 0})
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setCommentsModalVisible(false);
                  setReplyingTo(null);
                  setCommentText("");
                }}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Comments List */}
            {loadingComments ? (
              <View style={styles.loadingCommentsContainer}>
                <ActivityIndicator
                  size="large"
                  color={theme.colors.primary.blue}
                />
                <Text style={styles.loadingText}>Loading comments...</Text>
              </View>
            ) : (
              <ScrollView
                style={styles.commentsList}
                showsVerticalScrollIndicator={false}
              >
                {postComments.length === 0 ? (
                  <View style={styles.noCommentsContainer}>
                    <MessageSquare
                      size={48}
                      color={theme.colors.text.tertiary}
                    />
                    <Text style={styles.noCommentsText}>
                      No comments yet. Be the first to comment!
                    </Text>
                  </View>
                ) : (
                  postComments.map((comment) => renderComment(comment))
                )}
              </ScrollView>
            )}

            {/* Comment Input */}
            <View style={styles.commentInputContainer}>
              {replyingTo && (
                <View style={styles.replyingToBar}>
                  <Text style={styles.replyingToText}>
                    Replying to {replyingTo.userName}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <X size={16} color={theme.colors.text.tertiary} />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.commentInputRow}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={
                    replyingTo
                      ? `Reply to ${replyingTo.userName}...`
                      : "Write a comment..."
                  }
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={500}
                  placeholderTextColor={theme.colors.text.placeholder}
                  editable={!submittingComment}
                />
                <TouchableOpacity
                  style={[
                    styles.sendCommentButton,
                    (!commentText.trim() || submittingComment) &&
                      styles.sendCommentButtonDisabled,
                  ]}
                  onPress={handleSendComment}
                  disabled={!commentText.trim() || submittingComment}
                >
                  {submittingComment ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Send size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Viewer Modal */}
      <Modal
        visible={imageViewerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerOverlay}>
          <View style={styles.imageViewerHeader}>
            <Text style={styles.imageViewerCounter}>
              {initialImageIndex + 1} / {selectedImages.length}
            </Text>
            <TouchableOpacity
              style={styles.imageViewerClose}
              onPress={() => setImageViewerVisible(false)}
            >
              <X size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={selectedImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={initialImageIndex}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item }) => (
              <View style={styles.imageViewerSlide}>
                <Image
                  source={{ uri: item }}
                  style={styles.imageViewerImage}
                  contentFit="contain"
                />
              </View>
            )}
            keyExtractor={(item, index) => `image-${index}`}
          />
        </View>
      </Modal>

      {/* Report Modal */}
      <Modal
        visible={reportModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setReportModalVisible(false);
          setSelectedReportType(null);
          setReportReason("");
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Post</Text>
              <TouchableOpacity
                onPress={() => {
                  setReportModalVisible(false);
                  setSelectedReportType(null);
                  setReportReason("");
                }}
                style={styles.closeButton}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.reportDescription}>
                Please select a reason for reporting this post
              </Text>

              <View style={styles.reportTypesList}>
                {REPORT_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.reportTypeOption,
                      selectedReportType === type.id &&
                        styles.reportTypeOptionSelected,
                    ]}
                    onPress={() => setSelectedReportType(type.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.reportTypeRadio,
                        selectedReportType === type.id &&
                          styles.reportTypeRadioSelected,
                      ]}
                    >
                      {selectedReportType === type.id && (
                        <View style={styles.reportTypeRadioInner} />
                      )}
                    </View>
                    <Text style={styles.reportTypeLabel}>{type.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.reportReasonContainer}>
                <Text style={styles.reportReasonLabel}>
                  Additional details (optional)
                </Text>
                <TextInput
                  style={styles.reportReasonInput}
                  placeholder="Provide more context about this report..."
                  value={reportReason}
                  onChangeText={setReportReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  placeholderTextColor={theme.colors.text.placeholder}
                  editable={!submittingReport}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitReportButton,
                  (!selectedReportType || submittingReport) &&
                    styles.submitReportButtonDisabled,
                ]}
                onPress={handleSubmitReport}
                disabled={!selectedReportType || submittingReport}
                activeOpacity={0.7}
              >
                {submittingReport ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Flag size={20} color="#FFFFFF" />
                    <Text style={styles.submitReportButtonText}>
                      Submit Report
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
  refreshButton: {
    padding: theme.spacing.xs,
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
  loadingCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.md,
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
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
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
  listContent: {
    paddingBottom: theme.spacing.massive,
  },
  postCard: {
    backgroundColor: theme.colors.background.secondary,
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.base,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.base,
    marginBottom: theme.spacing.md,
  },
  postUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  postAvatar: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  postAvatarText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  postUserName: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  postApartment: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginTop: 2,
  },
  postMenuButton: {
    padding: theme.spacing.xs,
  },
  postText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.base,
    marginBottom: theme.spacing.md,
  },
  singleImage: {
    width: "100%",
    height: 300,
    backgroundColor: theme.colors.neutral.gray200,
  },
  twoImagesContainer: {
    flexDirection: "row",
    gap: 2,
  },
  halfImage: {
    width: (width - 2) / 2,
    height: 250,
    backgroundColor: theme.colors.neutral.gray200,
  },
  multiImageContainer: {
    flexDirection: "row",
    height: 300,
    gap: 2,
  },
  mainImage: {
    width: (width * 2) / 3 - 1,
    height: 300,
    backgroundColor: theme.colors.neutral.gray200,
  },
  sideImages: {
    flex: 1,
    gap: 2,
  },
  sideImage: {
    width: "100%",
    height: 149,
    backgroundColor: theme.colors.neutral.gray200,
  },
  moreImagesContainer: {
    position: "relative",
  },
  moreImagesOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesText: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  postFooter: {
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  postStats: {
    flexDirection: "row",
    gap: theme.spacing.base,
  },
  postStatsText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.sm,
  },
  postAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  postActionText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.tertiary,
  },
  postActionTextActive: {
    color: theme.colors.primary.blue,
  },
  postTime: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    paddingHorizontal: theme.spacing.base,
    paddingTop: theme.spacing.xs,
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
  commentsModal: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    maxHeight: "90%",
    height: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  commentsList: {
    flex: 1,
  },
  noCommentsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  noCommentsText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  commentContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  replyContainer: {
    paddingLeft: theme.spacing.xl,
  },
  commentVoteLine: {
    width: 2,
    alignItems: "center",
    paddingTop: 36,
  },
  voteLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border.light,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.purple,
    justifyContent: "center",
    alignItems: "center",
  },
  commentAvatarText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  commentMeta: {
    flex: 1,
  },
  commentUserName: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  commentApartment: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  commentTime: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  commentText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  commentActions: {
    flexDirection: "row",
    gap: theme.spacing.base,
  },
  commentAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentActionText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.tertiary,
  },
  commentActionTextActive: {
    color: theme.colors.primary.blue,
  },
  repliesContainer: {
    marginTop: theme.spacing.sm,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border.light,
    backgroundColor: theme.colors.background.primary,
  },
  replyingToBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.primaryShades.blue50,
  },
  replyingToText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.primary.blue,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.spacing.sm,
    padding: theme.spacing.base,
  },
  commentInput: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    maxHeight: 100,
  },
  sendCommentButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.full,
  },
  sendCommentButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray300,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  imageViewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
  },
  imageViewerCounter: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
  },
  imageViewerClose: {
    padding: theme.spacing.xs,
  },
  imageViewerSlide: {
    width: width,
    justifyContent: "center",
    alignItems: "center",
  },
  imageViewerImage: {
    width: width,
    height: "100%",
  },
  reportModal: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: "80%",
  },
  reportDescription: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  reportTypesList: {
    marginBottom: theme.spacing.xl,
  },
  reportTypeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  reportTypeOptionSelected: {
    borderColor: theme.colors.primary.blue,
    backgroundColor: theme.colors.primaryShades.blue50,
  },
  reportTypeRadio: {
    width: 22,
    height: 22,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  reportTypeRadioSelected: {
    borderColor: theme.colors.primary.blue,
  },
  reportTypeRadioInner: {
    width: 12,
    height: 12,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.blue,
  },
  reportTypeLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.primary,
  },
  reportReasonContainer: {
    marginBottom: theme.spacing.xl,
  },
  reportReasonLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  reportReasonInput: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    minHeight: 100,
  },
  submitReportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing.md,
  },
  submitReportButtonDisabled: {
    backgroundColor: theme.colors.neutral.gray300,
  },
  submitReportButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
});

export default CommunityPosts;