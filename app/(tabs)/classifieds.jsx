// ============================================
// PAGE: Classifieds
// Marketplace for community members
// ============================================

import { Toast } from "@/components/RoomsManagementUI/Toast";
import { API_ENDPOINTS, buildApiUrl, PHOTO_CONFIG } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
    Book,
    Briefcase,
    Car,
    Clock,
    Filter,
    Heart,
    Home,
    MapPin,
    MessageSquare,
    MoreHorizontal,
    PawPrint,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Share2,
    ShoppingBag,
    Tag,
    TrendingUp,
    Tv,
    Wrench,
    X
} from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
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

// ============================================
// CATEGORIES
// ============================================
const CATEGORIES = [
  { id: "all", label: "All", icon: TrendingUp },
  { id: "furniture", label: "Furniture", icon: Home },
  { id: "electronics", label: "Electronics", icon: Tv },
  { id: "vehicles", label: "Vehicles", icon: Car },
  { id: "books", label: "Books", icon: Book },
  { id: "clothing", label: "Clothing", icon: ShoppingBag },
  { id: "services", label: "Services", icon: Briefcase },
  { id: "maintenance", label: "Maintenance", icon: Wrench },
  { id: "pets", label: "Pets", icon: PawPrint },
  { id: "other", label: "Other", icon: MoreHorizontal },
];

const Classifieds = () => {
  const router = useRouter();

  // Data state
  const [classifieds, setClassifieds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // UI state
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  // Filters
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [selectedCondition, setSelectedCondition] = useState("all");
  const [showSoldItems, setShowSoldItems] = useState(false);

  // Toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  const showToast = (message, type = "success") => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Fetch classifieds from API
  const fetchClassifieds = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to view classifieds", "error");
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      if (selectedCategory !== "all") {
        params.append("category", selectedCategory);
      }

      const url = `${buildApiUrl(API_ENDPOINTS.CLASSIFIEDS)}?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setClassifieds(data.classifieds || []);
      } else {
        showToast(data.error || "Failed to fetch classifieds", "error");
      }
    } catch (error) {
      console.error("Fetch classifieds error:", error);
      showToast("Failed to load classifieds", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  // Handle pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchClassifieds(false);
  }, [fetchClassifieds]);

  // Load data on mount and category change
  useEffect(() => {
    fetchClassifieds();
  }, [fetchClassifieds]);

  const formatPrice = (price) => {
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  const handleLike = async (itemId) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        showToast("Please login to like", "error");
        return;
      }

      // Optimistically update UI
      setClassifieds((prevClassifieds) =>
        prevClassifieds.map((item) =>
          item.id === itemId
            ? {
                ...item,
                isLiked: !item.isLiked,
                likeCount: item.isLiked ? item.likeCount - 1 : item.likeCount + 1,
              }
            : item
        )
      );

      // Update selected item if it's open
      if (selectedItem?.id === itemId) {
        setSelectedItem((prev) => ({
          ...prev,
          isLiked: !prev.isLiked,
          likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1,
        }));
      }

      const response = await fetch(buildApiUrl(API_ENDPOINTS.LIKE_CLASSIFIED), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ classifiedId: itemId }),
      });

      const data = await response.json();

      if (!data.success) {
        // Revert optimistic update on error
        setClassifieds((prevClassifieds) =>
          prevClassifieds.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  isLiked: !item.isLiked,
                  likeCount: item.isLiked ? item.likeCount + 1 : item.likeCount - 1,
                }
              : item
          )
        );

        if (selectedItem?.id === itemId) {
          setSelectedItem((prev) => ({
            ...prev,
            isLiked: !prev.isLiked,
            likeCount: prev.isLiked ? prev.likeCount + 1 : prev.likeCount - 1,
          }));
        }

        showToast(data.error || "Failed to like", "error");
      }
    } catch (error) {
      console.error("Like classified error:", error);
      showToast("Failed to like", "error");
    }
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setDetailsModalVisible(true);
  };

  const handleContact = (phone) => {
    showToast("Opening dialer...", "info");
    // Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = (item) => {
    showToast("Opening chat...", "info");
    // Navigate to chat with seller
  };

  const handleShare = (item) => {
    showToast("Sharing listing...", "info");
    // Share functionality
  };

  const applyFilters = () => {
    setFilterModalVisible(false);
    showToast("Filters applied", "success");
  };

  const clearFilters = () => {
    setPriceRange({ min: "", max: "" });
    setSelectedCondition("all");
    setShowSoldItems(false);
    showToast("Filters cleared", "success");
  };

  const filterClassifieds = () => {
    let filtered = classifieds;

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filter
    if (priceRange.min) {
      filtered = filtered.filter((item) => item.price >= parseInt(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter((item) => item.price <= parseInt(priceRange.max));
    }

    // Condition filter
    if (selectedCondition !== "all") {
      filtered = filtered.filter((item) => item.condition === selectedCondition);
    }

    // Status filter
    if (!showSoldItems) {
      filtered = filtered.filter((item) => item.status !== "sold");
    }

    return filtered;
  };

  const renderCategoryPill = (category) => {
    const Icon = category.icon;
    const isSelected = selectedCategory === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryPill,
          isSelected && styles.categoryPillSelected,
        ]}
        onPress={() => setSelectedCategory(category.id)}
        activeOpacity={0.7}
      >
        <Icon
          size={18}
          color={
            isSelected ? theme.colors.primary.blue : theme.colors.text.tertiary
          }
        />
        <Text
          style={[
            styles.categoryPillText,
            isSelected && styles.categoryPillTextSelected,
          ]}
        >
          {category.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderClassifiedCard = ({ item }) => {
    const categoryData = CATEGORIES.find((c) => c.id === item.category);
    const CategoryIcon = categoryData?.icon || Tag;

    // Build image URL from filename
    const imageUrl = item.images && item.images.length > 0
      ? `${PHOTO_CONFIG.BASE_URL}${item.images[0]}`
      : null;

    return (
      <TouchableOpacity
        style={styles.classifiedCard}
        onPress={() => handleViewDetails(item)}
        activeOpacity={0.7}
      >
        {/* Image */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.classifiedImage}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.classifiedImage, styles.placeholderImage]}>
              <Tag size={48} color={theme.colors.neutral.gray400} />
            </View>
          )}
          {item.images && item.images.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>+{item.images.length - 1}</Text>
            </View>
          )}
          {item.status === "sold" && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>SOLD</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
          >
            <Heart
              size={20}
              color={item.isLiked ? theme.colors.status.error : "#FFFFFF"}
              fill={item.isLiked ? theme.colors.status.error : "none"}
            />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.classifiedContent}>
          <View style={styles.classifiedHeader}>
            <View style={styles.categoryBadge}>
              <CategoryIcon size={12} color={theme.colors.primary.blue} />
              <Text style={styles.categoryBadgeText}>
                {categoryData?.label}
              </Text>
            </View>
            {item.isNegotiable && (
              <View style={styles.negotiableBadge}>
                <Text style={styles.negotiableBadgeText}>Negotiable</Text>
              </View>
            )}
          </View>

          <Text style={styles.classifiedTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text style={styles.classifiedDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <View style={styles.classifiedPrice}>
            <Text style={styles.priceText}>{formatPrice(item.price)}</Text>
            {item.condition && (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionBadgeText}>
                  {item.condition.charAt(0).toUpperCase() +
                    item.condition.slice(1)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.classifiedFooter}>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{item.userName}</Text>
              <View style={styles.locationInfo}>
                <MapPin size={12} color={theme.colors.text.tertiary} />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            </View>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Heart size={14} color={theme.colors.text.tertiary} />
              <Text style={styles.statText}>{item.likeCount}</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statText}>•</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statText}>{item.viewCount} views</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Classifieds</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Filter size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={theme.colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search classifieds..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.colors.text.placeholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={20} color={theme.colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {CATEGORIES.map(renderCategoryPill)}
        </ScrollView>

        {/* Results Count */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            {filterClassifieds().length} listings
          </Text>
        </View>

        {/* Classifieds List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary.blue} />
            <Text style={styles.loadingText}>Loading classifieds...</Text>
          </View>
        ) : (
          <FlatList
            data={filterClassifieds()}
            renderItem={renderClassifiedCard}
            keyExtractor={(item) => `classified-${item.id}`}
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
                <Tag size={48} color={theme.colors.neutral.gray400} />
                <Text style={styles.emptyStateText}>No listings found</Text>
                <Text style={styles.emptyStateSubtext}>
                  {classifieds.length === 0
                    ? "Be the first to create a listing!"
                    : "Try adjusting your filters"}
                </Text>
              </View>
            }
          />
        )}

        {/* Create Listing FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push("/classifieds/create")}
          activeOpacity={0.8}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Filter Modal */}
        <Modal
          visible={filterModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.filterModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Filters</Text>
                <TouchableOpacity
                  onPress={() => setFilterModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.text.primary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Price Range */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Price Range</Text>
                  <View style={styles.priceRangeInputs}>
                    <View style={styles.priceInput}>
                      <Text style={styles.priceInputLabel}>Min</Text>
                      <TextInput
                        style={styles.priceInputField}
                        placeholder="₹0"
                        value={priceRange.min}
                        onChangeText={(text) =>
                          setPriceRange({ ...priceRange, min: text })
                        }
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.text.placeholder}
                      />
                    </View>
                    <Text style={styles.priceRangeSeparator}>to</Text>
                    <View style={styles.priceInput}>
                      <Text style={styles.priceInputLabel}>Max</Text>
                      <TextInput
                        style={styles.priceInputField}
                        placeholder="₹100000"
                        value={priceRange.max}
                        onChangeText={(text) =>
                          setPriceRange({ ...priceRange, max: text })
                        }
                        keyboardType="numeric"
                        placeholderTextColor={theme.colors.text.placeholder}
                      />
                    </View>
                  </View>
                </View>

                {/* Condition */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Condition</Text>
                  <View style={styles.conditionOptions}>
                    {["all", "excellent", "good", "fair"].map((condition) => (
                      <TouchableOpacity
                        key={condition}
                        style={[
                          styles.conditionOption,
                          selectedCondition === condition &&
                            styles.conditionOptionSelected,
                        ]}
                        onPress={() => setSelectedCondition(condition)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.conditionOptionText,
                            selectedCondition === condition &&
                              styles.conditionOptionTextSelected,
                          ]}
                        >
                          {condition.charAt(0).toUpperCase() + condition.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Show Sold Items */}
                <TouchableOpacity
                  style={styles.toggleOption}
                  onPress={() => setShowSoldItems(!showSoldItems)}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.toggleOptionTitle}>
                      Show sold items
                    </Text>
                    <Text style={styles.toggleOptionSubtitle}>
                      Include items that are no longer available
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.toggle,
                      showSoldItems && styles.toggleActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.toggleThumb,
                        showSoldItems && styles.toggleThumbActive,
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </ScrollView>

              <View style={styles.filterActions}>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={clearFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={applyFilters}
                  activeOpacity={0.7}
                >
                  <Text style={styles.applyButtonText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Details Modal */}
        <Modal
          visible={detailsModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setDetailsModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModal}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedItem && (
                  <>
                    {/* Images */}
                    <ScrollView
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.detailsImageScroll}
                    >
                      {selectedItem.images && selectedItem.images.length > 0 ? (
                        selectedItem.images.map((img, index) => (
                          <Image
                            key={index}
                            source={{ uri: `${PHOTO_CONFIG.BASE_URL}${img}` }}
                            style={styles.detailsImage}
                            contentFit="cover"
                          />
                        ))
                      ) : (
                        <View style={[styles.detailsImage, styles.placeholderImage]}>
                          <Tag size={64} color={theme.colors.neutral.gray400} />
                        </View>
                      )}
                    </ScrollView>

                    {/* Close Button */}
                    <TouchableOpacity
                      style={styles.detailsCloseButton}
                      onPress={() => setDetailsModalVisible(false)}
                    >
                      <X size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {/* Content */}
                    <View style={styles.detailsContent}>
                      <View style={styles.detailsHeader}>
                        <View style={styles.detailsPrice}>
                          <Text style={styles.detailsPriceText}>
                            {formatPrice(selectedItem.price)}
                          </Text>
                          {selectedItem.isNegotiable && (
                            <View style={styles.negotiableBadge}>
                              <Text style={styles.negotiableBadgeText}>
                                Negotiable
                              </Text>
                            </View>
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleLike(selectedItem.id)}
                        >
                          <Heart
                            size={28}
                            color={
                              selectedItem.isLiked
                                ? theme.colors.status.error
                                : theme.colors.text.tertiary
                            }
                            fill={
                              selectedItem.isLiked
                                ? theme.colors.status.error
                                : "none"
                            }
                          />
                        </TouchableOpacity>
                      </View>

                      <Text style={styles.detailsTitle}>
                        {selectedItem.title}
                      </Text>

                      <View style={styles.detailsMeta}>
                        <View style={styles.detailsMetaItem}>
                          <Clock size={16} color={theme.colors.text.tertiary} />
                          <Text style={styles.detailsMetaText}>
                            {formatTime(selectedItem.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.detailsMetaItem}>
                          <MapPin size={16} color={theme.colors.text.tertiary} />
                          <Text style={styles.detailsMetaText}>
                            {selectedItem.location}
                          </Text>
                        </View>
                      </View>

                      {selectedItem.condition && (
                        <View style={styles.detailsCondition}>
                          <Text style={styles.detailsConditionLabel}>
                            Condition:
                          </Text>
                          <Text style={styles.detailsConditionValue}>
                            {selectedItem.condition.charAt(0).toUpperCase() +
                              selectedItem.condition.slice(1)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.divider} />

                      <Text style={styles.detailsDescription}>
                        {selectedItem.description}
                      </Text>

                      <View style={styles.divider} />

                      <View style={styles.sellerSection}>
                        <Text style={styles.sellerSectionTitle}>
                          Seller Information
                        </Text>
                        <View style={styles.sellerDetails}>
                          <View style={styles.sellerAvatar}>
                            <Text style={styles.sellerAvatarText}>
                              {selectedItem.userName.charAt(0)}
                            </Text>
                          </View>
                          <View style={styles.sellerInfo}>
                            <Text style={styles.sellerNameLarge}>
                              {selectedItem.userName}
                            </Text>
                            <Text style={styles.sellerApartmentLarge}>
                              {selectedItem.userApartment}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={styles.detailsActions}>
                        <TouchableOpacity
                          style={styles.detailsActionButton}
                          onPress={() => handleMessage(selectedItem)}
                          activeOpacity={0.7}
                        >
                          <MessageSquare size={20} color={theme.colors.primary.blue} />
                          <Text style={styles.detailsActionButtonText}>
                            Message
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.detailsActionButton,
                            styles.detailsActionButtonPrimary,
                          ]}
                          onPress={() => handleContact(selectedItem.contactPhone)}
                          activeOpacity={0.7}
                        >
                          <Phone size={20} color="#FFFFFF" />
                          <Text style={styles.detailsActionButtonTextPrimary}>
                            Call Seller
                          </Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        style={styles.shareButton}
                        onPress={() => handleShare(selectedItem)}
                        activeOpacity={0.7}
                      >
                        <Share2 size={18} color={theme.colors.text.secondary} />
                        <Text style={styles.shareButtonText}>
                          Share this listing
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
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
  placeholderImage: {
    backgroundColor: theme.colors.neutral.gray100,
    justifyContent: "center",
    alignItems: "center",
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
  headerActions: {
    flexDirection: "row",
    gap: theme.spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.xs,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  categoriesContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  categoryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  categoryPillSelected: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  categoryPillText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
  },
  categoryPillTextSelected: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  resultsHeader: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  resultsCount: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.massive,
  },
  classifiedCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    marginBottom: theme.spacing.base,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    backgroundColor: theme.colors.neutral.gray200,
  },
  classifiedImage: {
    width: "100%",
    height: "100%",
  },
  imageCountBadge: {
    position: "absolute",
    bottom: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  imageCountText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.semiBold,
    color: "#FFFFFF",
  },
  soldBadge: {
    position: "absolute",
    top: theme.spacing.sm,
    left: theme.spacing.sm,
    backgroundColor: theme.colors.status.error,
    borderRadius: theme.borderRadius.input,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
  },
  soldBadgeText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  likeButton: {
    position: "absolute",
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  classifiedContent: {
    padding: theme.spacing.base,
  },
  classifiedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.colors.primaryShades.blue50,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  negotiableBadge: {
    backgroundColor: theme.colors.status.successLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  negotiableBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.status.success,
  },
  classifiedTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  classifiedDescription: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.sm,
  },
  classifiedPrice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  priceText: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  conditionBadge: {
    backgroundColor: theme.colors.neutral.gray100,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  conditionBadgeText: {
    fontSize: 11,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  classifiedFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  timeText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.giant,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.md,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
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
  filterModal: {
    backgroundColor: theme.colors.background.primary,
    borderTopLeftRadius: theme.borderRadius.sheet,
    borderTopRightRadius: theme.borderRadius.sheet,
    padding: theme.spacing.xl,
    maxHeight: "80%",
  },
  detailsModal: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
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
  filterSection: {
    marginBottom: theme.spacing.xl,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  priceRangeInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  priceInput: {
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  priceInputField: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.base,
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
  },
  priceRangeSeparator: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.tertiary,
    marginTop: 24,
  },
  conditionOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  conditionOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.base,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  conditionOptionSelected: {
    backgroundColor: theme.colors.primaryShades.blue50,
    borderColor: theme.colors.primary.blue,
  },
  conditionOptionText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  conditionOptionTextSelected: {
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.primary.blue,
  },
  toggleOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.xl,
  },
  toggleOptionTitle: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  toggleOptionSubtitle: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral.gray300,
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: theme.colors.primary.blue,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
  filterActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
  },
  clearButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.button,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  applyButton: {
    flex: 1,
    backgroundColor: theme.colors.primary.blue,
    borderRadius: theme.borderRadius.button,
    paddingVertical: theme.spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  detailsImageScroll: {
    height: 300,
  },
  detailsImage: {
    width: width,
    height: 300,
  },
  detailsCloseButton: {
    position: "absolute",
    top: 60,
    right: theme.spacing.lg,
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  detailsContent: {
    padding: theme.spacing.xl,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  detailsPrice: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
  },
  detailsPriceText: {
    fontSize: 28,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  detailsTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  detailsMeta: {
    flexDirection: "row",
    gap: theme.spacing.base,
    marginBottom: theme.spacing.md,
  },
  detailsMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailsMetaText: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  detailsCondition: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  detailsConditionLabel: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: theme.colors.text.secondary,
  },
  detailsConditionValue: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border.light,
    marginVertical: theme.spacing.lg,
  },
  detailsDescription: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.primary,
    lineHeight: 24,
  },
  sellerSection: {
    marginBottom: theme.spacing.xl,
  },
  sellerSectionTitle: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  sellerDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.base,
  },
  sellerAvatar: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary.blue,
    justifyContent: "center",
    alignItems: "center",
  },
  sellerAvatarText: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.bold,
    color: "#FFFFFF",
  },
  sellerNameLarge: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  sellerApartmentLarge: {
    fontSize: 13,
    fontFamily: theme.typography.fonts.regular,
    color: theme.colors.text.tertiary,
  },
  detailsActions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  detailsActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.button,
    backgroundColor: theme.colors.background.secondary,
    borderWidth: 2,
    borderColor: theme.colors.primary.blue,
  },
  detailsActionButtonPrimary: {
    backgroundColor: theme.colors.primary.blue,
    borderColor: theme.colors.primary.blue,
  },
  detailsActionButtonText: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  detailsActionButtonTextPrimary: {
    color: "#FFFFFF",
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  shareButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.secondary,
  },
});

export default Classifieds;