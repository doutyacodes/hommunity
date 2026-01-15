// // ============================================
// // FILE: app/(tabs)/index.jsx
// // Home Tab - Create Guest with QR Code
// // Modern UI with preapproved, private, frequent/one-time options
// // ============================================

// import QRCodeDisplay from "@/components/user/QRCodeDisplay";
// import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
// import { getAuthToken } from "@/services/authService";
// import { borderRadius, colors, spacing, typography } from "@/theme";
// import { toDateString, toTimeString } from "@/utils/dateHelpers";
// import { Ionicons } from "@expo/vector-icons";
// import DateTimePicker from "@react-native-community/datetimepicker";
// import { useRouter } from "expo-router";
// import { useEffect, useState } from "react";
// import {
//   ActivityIndicator,
//   Alert,
//   Modal,
//   ScrollView,
//   StyleSheet,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   View,
// } from "react-native";

// export default function HomeTab() {
//   const router = useRouter();
//   const [loading, setLoading] = useState(false);
//   const [loadingApartment, setLoadingApartment] = useState(true);
//   const [currentApartment, setCurrentApartment] = useState(null);
//   const [noApartments, setNoApartments] = useState(false);

//   // Form State
//   const [guestName, setGuestName] = useState("");
//   const [guestPhone, setGuestPhone] = useState("");
//   const [guestType, setGuestType] = useState("one_time"); // 'one_time' | 'frequent'
//   const [approvalType, setApprovalType] = useState("preapproved"); // 'preapproved' | 'private' | 'needs_approval'
//   const [totalMembers, setTotalMembers] = useState(1);
//   const [vehicleNumber, setVehicleNumber] = useState("");
//   const [purpose, setPurpose] = useState("");

//   // Date/Time State
//   const [startDate, setStartDate] = useState(new Date());
//   const [endDate, setEndDate] = useState(null);
//   const [startTime, setStartTime] = useState(null);
//   const [endTime, setEndTime] = useState(null);
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [datePickerType, setDatePickerType] = useState("start"); // 'start' | 'end'
//   const [timePickerType, setTimePickerType] = useState("start"); // 'start' | 'end'

//   // QR Modal State
//   const [showQRModal, setShowQRModal] = useState(false);
//   const [createdGuest, setCreatedGuest] = useState(null);

//   useEffect(() => {
//     loadCurrentApartment();
//   }, []);

//   const loadCurrentApartment = async () => {
//     try {
//       setLoadingApartment(true);
//       const token = await getAuthToken();
//       const response = await fetch(
//         buildApiUrl(API_ENDPOINTS.GET_CURRENT_APARTMENT),
//         {
//           method: "POST", // 👈 IMPORTANT
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ token }), // 👈 send token in body
//         }
//       );
//       const data = await response.json();
//       // console.log("data apartment:", data);

//       if (data.success && data.apartment) {
//         setCurrentApartment(data.apartment);
//         setNoApartments(false);
//       } else {
//         // User has no approved apartments
//         setCurrentApartment(null);
//         setNoApartments(true);
//       }
//     } catch (error) {
//       console.error("Error loading apartment:", error);
//       setNoApartments(true);
//     } finally {
//       setLoadingApartment(false);
//     }
//   };

//   const handleCreateGuest = async () => {
//     // Validation
//     if (!guestName.trim()) {
//       Alert.alert("Error", "Please enter guest name");
//       return;
//     }

//     if (!currentApartment) {
//       Alert.alert("Error", "No apartment selected");
//       return;
//     }

//     setLoading(true);

//     try {
//       const token = await getAuthToken();

//       const guestData = {
//         token, // 👈 include token in body instead of headers
//         guestName: guestName.trim(),
//         guestPhone: guestPhone.trim() || null,
//         guestType,
//         approvalType,
//         totalMembers: parseInt(totalMembers) || 1,
//         vehicleNumber: vehicleNumber.trim() || null,
//         purpose: purpose.trim() || null,
//         startDate: toDateString(startDate),
//         endDate: endDate ? toDateString(endDate) : null,
//         startTime: startTime ? toTimeString(startTime) : null,
//         endTime: endTime ? toTimeString(endTime) : null,
//         apartmentId: currentApartment.apartmentId,
//       };

//       const response = await fetch(buildApiUrl(API_ENDPOINTS.CREATE_GUEST), {
//         method: "POST",
//         headers: { "Content-Type": "application/json" }, // ✅ simple JSON header
//         body: JSON.stringify(guestData),
//       });

//       const data = await response.json();

//       if (data.success) {
//         setCreatedGuest(data.guest);
//         setShowQRModal(true);
//         resetForm();
//         Alert.alert("Success", "Guest created successfully!");
//       } else {
//         Alert.alert("Error", data.message || "Failed to create guest");
//       }
//     } catch (error) {
//       console.error("Create guest error:", error);
//       Alert.alert("Error", "Failed to create guest");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const resetForm = () => {
//     setGuestName("");
//     setGuestPhone("");
//     setVehicleNumber("");
//     setPurpose("");
//     setTotalMembers(1);
//     setStartDate(new Date());
//     setEndDate(null);
//     setStartTime(null);
//     setEndTime(null);
//   };

//   const handleDateChange = (event, selectedDate) => {
//     setShowDatePicker(false);
//     if (selectedDate) {
//       if (datePickerType === "start") {
//         setStartDate(selectedDate);
//       } else {
//         setEndDate(selectedDate);
//       }
//     }
//   };

//   const handleTimeChange = (event, selectedTime) => {
//     setShowTimePicker(false);
//     if (selectedTime) {
//       if (timePickerType === "start") {
//         setStartTime(selectedTime);
//       } else {
//         setEndTime(selectedTime);
//       }
//     }
//   };

//   // Loading state
//   if (loadingApartment) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color={colors.primary.blue} />
//         <Text style={styles.loadingText}>Loading...</Text>
//       </View>
//     );
//   }

//   // No apartments state
//   if (noApartments || !currentApartment) {
//     return (
//       <View style={styles.loadingContainer}>
//         <Ionicons name="home-outline" size={80} color={colors.text.disabled} />
//         <Text style={styles.emptyStateTitle}>No Apartment Found</Text>
//         <Text style={styles.emptyStateText}>
//           You need to add an apartment before creating guests
//         </Text>
//         <TouchableOpacity
//           style={styles.addApartmentButton}
//           onPress={() => router.push("/user/add-apartment")}
//           activeOpacity={0.7}
//         >
//           <Ionicons
//             name="add-circle"
//             size={20}
//             color={colors.background.primary}
//           />
//           <Text style={styles.addApartmentButtonText}>Add Apartment</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <ScrollView
//         style={styles.scrollView}
//         contentContainerStyle={styles.scrollContent}
//         showsVerticalScrollIndicator={false}
//       >
//         {/* Header */}
//         <View style={styles.header}>
//           <View>
//             <Text style={styles.title}>Create Guest</Text>
//             <Text style={styles.subtitle}>Generate QR code for your guest</Text>
//           </View>
//           <View style={styles.apartmentBadge}>
//             <Ionicons name="home" size={16} color={colors.primary.blue} />
//             <Text style={styles.apartmentText}>
//               {currentApartment.towerName} {currentApartment.apartmentNumber}
//             </Text>
//           </View>
//         </View>

//         {/* Guest Type Selector */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Guest Type</Text>
//           <View style={styles.optionGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.optionButton,
//                 guestType === "one_time" && styles.optionButtonActive,
//               ]}
//               onPress={() => setGuestType("one_time")}
//               activeOpacity={0.7}
//             >
//               <Ionicons
//                 name={
//                   guestType === "one_time"
//                     ? "radio-button-on"
//                     : "radio-button-off"
//                 }
//                 size={20}
//                 color={
//                   guestType === "one_time"
//                     ? colors.primary.blue
//                     : colors.text.tertiary
//                 }
//               />
//               <View style={styles.optionContent}>
//                 <Text
//                   style={[
//                     styles.optionTitle,
//                     guestType === "one_time" && styles.optionTitleActive,
//                   ]}
//                 >
//                   One-Time
//                 </Text>
//                 <Text style={styles.optionDescription}>Single visit guest</Text>
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[
//                 styles.optionButton,
//                 guestType === "frequent" && styles.optionButtonActive,
//               ]}
//               onPress={() => setGuestType("frequent")}
//               activeOpacity={0.7}
//             >
//               <Ionicons
//                 name={
//                   guestType === "frequent"
//                     ? "radio-button-on"
//                     : "radio-button-off"
//                 }
//                 size={20}
//                 color={
//                   guestType === "frequent"
//                     ? colors.primary.blue
//                     : colors.text.tertiary
//                 }
//               />
//               <View style={styles.optionContent}>
//                 <Text
//                   style={[
//                     styles.optionTitle,
//                     guestType === "frequent" && styles.optionTitleActive,
//                   ]}
//                 >
//                   Frequent
//                 </Text>
//                 <Text style={styles.optionDescription}>
//                   Multiple visits allowed
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Approval Type Selector */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Approval Type</Text>
//           <View style={styles.optionGroup}>
//             <TouchableOpacity
//               style={[
//                 styles.optionButton,
//                 approvalType === "preapproved" && styles.optionButtonActive,
//               ]}
//               onPress={() => setApprovalType("preapproved")}
//               activeOpacity={0.7}
//             >
//               <Ionicons
//                 name={
//                   approvalType === "preapproved"
//                     ? "radio-button-on"
//                     : "radio-button-off"
//                 }
//                 size={20}
//                 color={
//                   approvalType === "preapproved"
//                     ? colors.status.success
//                     : colors.text.tertiary
//                 }
//               />
//               <View style={styles.optionContent}>
//                 <Text
//                   style={[
//                     styles.optionTitle,
//                     approvalType === "preapproved" && styles.optionTitleActive,
//                   ]}
//                 >
//                   Pre-approved
//                 </Text>
//                 <Text style={styles.optionDescription}>
//                   Direct entry allowed
//                 </Text>
//               </View>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[
//                 styles.optionButton,
//                 approvalType === "private" && styles.optionButtonActive,
//               ]}
//               onPress={() => setApprovalType("private")}
//               activeOpacity={0.7}
//             >
//               <Ionicons
//                 name={
//                   approvalType === "private"
//                     ? "radio-button-on"
//                     : "radio-button-off"
//                 }
//                 size={20}
//                 color={
//                   approvalType === "private"
//                     ? colors.primary.purple
//                     : colors.text.tertiary
//                 }
//               />
//               <View style={styles.optionContent}>
//                 <Text
//                   style={[
//                     styles.optionTitle,
//                     approvalType === "private" && styles.optionTitleActive,
//                   ]}
//                 >
//                   Private
//                 </Text>
//                 <Text style={styles.optionDescription}>
//                   Only you get notified
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Guest Information */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Guest Information</Text>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Guest Name *</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter guest name"
//               placeholderTextColor={colors.text.placeholder}
//               value={guestName}
//               onChangeText={setGuestName}
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Phone Number</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter phone number"
//               placeholderTextColor={colors.text.placeholder}
//               value={guestPhone}
//               onChangeText={setGuestPhone}
//               keyboardType="phone-pad"
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Vehicle Number</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter vehicle number"
//               placeholderTextColor={colors.text.placeholder}
//               value={vehicleNumber}
//               onChangeText={setVehicleNumber}
//               autoCapitalize="characters"
//             />
//           </View>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>
//               Total Members (including guest)
//             </Text>
//             <View style={styles.counterContainer}>
//               <TouchableOpacity
//                 style={styles.counterButton}
//                 onPress={() => setTotalMembers(Math.max(1, totalMembers - 1))}
//                 activeOpacity={0.7}
//               >
//                 <Ionicons name="remove" size={20} color={colors.text.primary} />
//               </TouchableOpacity>
//               <Text style={styles.counterValue}>{totalMembers}</Text>
//               <TouchableOpacity
//                 style={styles.counterButton}
//                 onPress={() => setTotalMembers(totalMembers + 1)}
//                 activeOpacity={0.7}
//               >
//                 <Ionicons name="add" size={20} color={colors.text.primary} />
//               </TouchableOpacity>
//             </View>
//           </View>

//           <View style={styles.inputContainer}>
//             <Text style={styles.inputLabel}>Purpose of Visit</Text>
//             <TextInput
//               style={[styles.input, styles.textArea]}
//               placeholder="Enter purpose (optional)"
//               placeholderTextColor={colors.text.placeholder}
//               value={purpose}
//               onChangeText={setPurpose}
//               multiline
//               numberOfLines={3}
//               textAlignVertical="top"
//             />
//           </View>
//         </View>

//         {/* Date & Time */}
//         <View style={styles.section}>
//           <Text style={styles.sectionTitle}>Validity Period</Text>

//           <View style={styles.dateTimeRow}>
//             <TouchableOpacity
//               style={styles.dateTimeButton}
//               onPress={() => {
//                 setDatePickerType("start");
//                 setShowDatePicker(true);
//               }}
//               activeOpacity={0.7}
//             >
//               <Ionicons
//                 name="calendar-outline"
//                 size={20}
//                 color={colors.primary.blue}
//               />
//               <View style={styles.dateTimeContent}>
//                 <Text style={styles.dateTimeLabel}>Start Date</Text>
//                 <Text style={styles.dateTimeValue}>
//                   {toDateString(startDate)}
//                 </Text>
//               </View>
//             </TouchableOpacity>

//             {guestType === "frequent" && (
//               <TouchableOpacity
//                 style={styles.dateTimeButton}
//                 onPress={() => {
//                   setDatePickerType("end");
//                   setShowDatePicker(true);
//                 }}
//                 activeOpacity={0.7}
//               >
//                 <Ionicons
//                   name="calendar-outline"
//                   size={20}
//                   color={colors.primary.blue}
//                 />
//                 <View style={styles.dateTimeContent}>
//                   <Text style={styles.dateTimeLabel}>End Date</Text>
//                   <Text style={styles.dateTimeValue}>
//                     {endDate ? toDateString(endDate) : "Select"}
//                   </Text>
//                 </View>
//               </TouchableOpacity>
//             )}
//           </View>
//         </View>

//         {/* Create Button */}
//         <TouchableOpacity
//           style={[styles.createButton, loading && styles.createButtonDisabled]}
//           onPress={handleCreateGuest}
//           disabled={loading}
//           activeOpacity={0.7}
//         >
//           {loading ? (
//             <ActivityIndicator color={colors.background.primary} />
//           ) : (
//             <>
//               <Ionicons
//                 name="qr-code"
//                 size={20}
//                 color={colors.background.primary}
//               />
//               <Text style={styles.createButtonText}>
//                 Create Guest & Generate QR
//               </Text>
//             </>
//           )}
//         </TouchableOpacity>
//       </ScrollView>

//       {/* Date Picker Modal */}
//       {showDatePicker && (
//         <DateTimePicker
//           value={datePickerType === "start" ? startDate : endDate || new Date()}
//           mode="date"
//           display="default"
//           onChange={handleDateChange}
//           minimumDate={new Date()}
//         />
//       )}

//       {/* QR Code Modal */}
//       <Modal
//         visible={showQRModal}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setShowQRModal(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Guest QR Code</Text>
//               <TouchableOpacity
//                 onPress={() => setShowQRModal(false)}
//                 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
//               >
//                 <Ionicons name="close" size={24} color={colors.text.primary} />
//               </TouchableOpacity>
//             </View>

//             {createdGuest && (
//               <ScrollView contentContainerStyle={styles.qrScrollContent}>
//                 <QRCodeDisplay
//                   guestData={{
//                     ...createdGuest,
//                     apartmentNumber: currentApartment.apartmentNumber,
//                     towerName: currentApartment.towerName,
//                   }}
//                   encryptedData={createdGuest.qrEncryptedData}
//                   size={220}
//                 />
//               </ScrollView>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: colors.background.secondary,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: colors.background.secondary,
//   },
//   loadingText: {
//     fontFamily: typography.fonts.medium,
//     fontSize: typography.sizes.base,
//     color: colors.text.secondary,
//     marginTop: spacing.md,
//   },
//   emptyStateTitle: {
//     fontFamily: typography.fonts.bold,
//     fontSize: typography.sizes.xl,
//     color: colors.text.primary,
//     marginTop: spacing.lg,
//     marginBottom: spacing.xs,
//   },
//   emptyStateText: {
//     fontFamily: typography.fonts.regular,
//     fontSize: typography.sizes.base,
//     color: colors.text.tertiary,
//     textAlign: "center",
//     marginBottom: spacing.xl,
//     paddingHorizontal: spacing.xl,
//   },
//   addApartmentButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: colors.primary.blue,
//     paddingVertical: spacing.md,
//     paddingHorizontal: spacing.xl,
//     borderRadius: borderRadius.lg,
//     gap: spacing.xs,
//   },
//   addApartmentButtonText: {
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.base,
//     color: colors.background.primary,
//   },
//   scrollView: {
//     flex: 1,
//   },
//   scrollContent: {
//     padding: spacing.base,
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-start",
//     marginBottom: spacing.lg,
//   },
//   title: {
//     fontFamily: typography.fonts.bold,
//     fontSize: typography.sizes.xxl,
//     color: colors.text.primary,
//     marginBottom: spacing.xxs,
//   },
//   subtitle: {
//     fontFamily: typography.fonts.regular,
//     fontSize: typography.sizes.sm,
//     color: colors.text.tertiary,
//   },
//   apartmentBadge: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: colors.primaryShades.blue50,
//     paddingVertical: spacing.xs,
//     paddingHorizontal: spacing.sm,
//     borderRadius: borderRadius.full,
//     gap: spacing.xxs,
//   },
//   apartmentText: {
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.xs,
//     color: colors.primary.blue,
//   },
//   section: {
//     marginBottom: spacing.lg,
//   },
//   sectionTitle: {
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.base,
//     color: colors.text.primary,
//     marginBottom: spacing.md,
//   },
//   optionGroup: {
//     gap: spacing.sm,
//   },
//   optionButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: colors.background.primary,
//     borderWidth: 1,
//     borderColor: colors.border.light,
//     borderRadius: borderRadius.lg,
//     padding: spacing.md,
//     gap: spacing.sm,
//   },
//   optionButtonActive: {
//     borderColor: colors.primary.blue,
//     borderWidth: 2,
//     backgroundColor: colors.primaryShades.blue50,
//   },
//   optionContent: {
//     flex: 1,
//   },
//   optionTitle: {
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.base,
//     color: colors.text.primary,
//     marginBottom: 2,
//   },
//   optionTitleActive: {
//     color: colors.primary.blue,
//   },
//   optionDescription: {
//     fontFamily: typography.fonts.regular,
//     fontSize: typography.sizes.xs,
//     color: colors.text.tertiary,
//   },
//   inputContainer: {
//     marginBottom: spacing.md,
//   },
//   inputLabel: {
//     fontFamily: typography.fonts.medium,
//     fontSize: typography.sizes.sm,
//     color: colors.text.secondary,
//     marginBottom: spacing.xs,
//   },
//   input: {
//     backgroundColor: colors.background.primary,
//     borderWidth: 1,
//     borderColor: colors.border.light,
//     borderRadius: borderRadius.lg,
//     paddingHorizontal: spacing.base,
//     paddingVertical: spacing.md,
//     fontFamily: typography.fonts.regular,
//     fontSize: typography.sizes.base,
//     color: colors.text.primary,
//   },
//   textArea: {
//     height: 80,
//     paddingTop: spacing.md,
//   },
//   counterContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: colors.background.primary,
//     borderWidth: 1,
//     borderColor: colors.border.light,
//     borderRadius: borderRadius.lg,
//     padding: spacing.xs,
//   },
//   counterButton: {
//     width: 40,
//     height: 40,
//     justifyContent: "center",
//     alignItems: "center",
//     backgroundColor: colors.background.secondary,
//     borderRadius: borderRadius.md,
//   },
//   counterValue: {
//     flex: 1,
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.lg,
//     color: colors.text.primary,
//     textAlign: "center",
//   },
//   dateTimeRow: {
//     flexDirection: "row",
//     gap: spacing.sm,
//   },
//   dateTimeButton: {
//     flex: 1,
//     flexDirection: "row",
//     alignItems: "center",
//     backgroundColor: colors.background.primary,
//     borderWidth: 1,
//     borderColor: colors.border.light,
//     borderRadius: borderRadius.lg,
//     padding: spacing.md,
//     gap: spacing.sm,
//   },
//   dateTimeContent: {
//     flex: 1,
//   },
//   dateTimeLabel: {
//     fontFamily: typography.fonts.regular,
//     fontSize: typography.sizes.xs,
//     color: colors.text.tertiary,
//     marginBottom: 2,
//   },
//   dateTimeValue: {
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.sm,
//     color: colors.text.primary,
//   },
//   createButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     backgroundColor: colors.primary.blue,
//     borderRadius: borderRadius.lg,
//     paddingVertical: spacing.base,
//     gap: spacing.sm,
//     marginTop: spacing.md,
//     marginBottom: spacing.xxl,
//   },
//   createButtonDisabled: {
//     opacity: 0.6,
//   },
//   createButtonText: {
//     fontFamily: typography.fonts.semiBold,
//     fontSize: typography.sizes.base,
//     color: colors.background.primary,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: colors.background.overlay,
//     justifyContent: "flex-end",
//   },
//   modalContent: {
//     backgroundColor: colors.background.primary,
//     borderTopLeftRadius: borderRadius.xxxl,
//     borderTopRightRadius: borderRadius.xxxl,
//     paddingTop: spacing.lg,
//     paddingBottom: spacing.huge,
//     maxHeight: "90%",
//   },
//   modalHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: spacing.base,
//     marginBottom: spacing.lg,
//   },
//   modalTitle: {
//     fontFamily: typography.fonts.bold,
//     fontSize: typography.sizes.xl,
//     color: colors.text.primary,
//   },
//   qrScrollContent: {
//     paddingHorizontal: spacing.base,
//     alignItems: "center",
//   },
// });


// ============================================
// PAGE: Home Dashboard
// Shows apartment overview, rooms, tenants/owners, rent, etc.
// Uses GateWise Theme
// ============================================

import { API_ENDPOINTS, buildApiUrl, getApiHeaders } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHome = async () => {
      try {
        const token = await getAuthToken();
        const res = await fetch(buildApiUrl(API_ENDPOINTS.USER_HOME), {
          method: "GET",
          headers: getApiHeaders(token),
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          console.log("❌ Home API failed:", json.error);
        }
      } catch (err) {
        console.error("❌ Home fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHome();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.blue} />
        <Text style={styles.loadingText}>Loading your home...</Text>
      </View>
    );
  }

  // No apartment case
  if (!data || !data.apartment) {
    return (
      <View style={styles.noApartmentContainer}>
        <Ionicons name="home-outline" size={80} color={theme.colors.primary.blue} />
        <Text style={styles.noApartmentTitle}>No Apartment Linked</Text>
        <Text style={styles.noApartmentSubtitle}>
          Join or add your apartment to access your community dashboard.
        </Text>
        <TouchableOpacity
          style={styles.addApartmentButton}
          onPress={() => router.push("/user/add-apartment")}
          activeOpacity={0.8}
        >
          <Ionicons name="add-circle" size={22} color={theme.colors.neutral.white} />
          <Text style={styles.addApartmentButtonText}>Add Apartment</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { apartment, members, rentSession, rooms } = data;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* COMMUNITY HEADER */}
      <View style={styles.communityCard}>
        {apartment.community.image && (
          <Image
            source={{ uri: apartment.community.image }}
            style={styles.communityImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.communityInfo}>
          <Text style={styles.communityName}>{apartment.community.name}</Text>
          <Text style={styles.apartmentDetails}>
            {apartment.number} • Tower {apartment.tower}
          </Text>
          <Text style={styles.ownershipType}>
            {apartment.ownershipType === "owner" ? "🏡 Owner" : "🏠 Tenant"}
          </Text>
        </View>
      </View>

      {/* MEMBERS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Members</Text>
        {members.length === 0 ? (
          <Text style={styles.emptyText}>No members added yet</Text>
        ) : (
          <View style={styles.memberList}>
            {members.map((m) => (
              <View key={m.id} style={styles.memberCard}>
                {m.userImage ? (
                  <Image source={{ uri: m.userImage }} style={styles.memberAvatar} />
                ) : (
                  <View style={[styles.memberAvatar, styles.memberPlaceholder]}>
                    <Text style={styles.memberInitial}>
                      {m.userName?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.userName}</Text>
                  <Text style={styles.memberType}>
                    {m.ownershipType === "owner" ? "Owner" : "Tenant"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* RENT INFO */}
      {rentSession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rent Details</Text>
          <View style={styles.card}>
            <Text style={styles.rentText}>💰 ₹{rentSession.rentAmount}</Text>
            <Text style={styles.rentSubText}>Maintenance: ₹{rentSession.maintenanceCost}</Text>
            <Text style={styles.rentSubText}>Deposit: ₹{rentSession.initialDeposit}</Text>
            <Text style={styles.rentStatus}>Status: {rentSession.status}</Text>
          </View>
        </View>
      )}

      {/* ROOMS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rooms</Text>
        {rooms.length === 0 ? (
          <Text style={styles.emptyText}>No rooms listed</Text>
        ) : (
          rooms.map((room) => (
            <View key={room.id} style={styles.roomCard}>
              <Text style={styles.roomName}>{room.name}</Text>
              {room.accessories.length > 0 && (
                <View style={styles.accessoriesList}>
                  {room.accessories.map((acc) => (
                    <Text key={acc.id} style={styles.accessoryItem}>
                      • {acc.accessoryName} ({acc.quantity})
                    </Text>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <View style={{ height: theme.spacing.giant }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background.primary,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.medium,
  },
  noApartmentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
  },
  noApartmentTitle: {
    fontSize: 22,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing.lg,
  },
  noApartmentSubtitle: {
    textAlign: "center",
    color: theme.colors.text.secondary,
    fontFamily: theme.typography.fonts.regular,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  addApartmentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.button,
    ...theme.shadows.md,
  },
  addApartmentButtonText: {
    color: theme.colors.neutral.white,
    fontFamily: theme.typography.fonts.semiBold,
    fontSize: 16,
  },
  communityCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    ...theme.shadows.sm,
    marginBottom: theme.spacing.xl,
    overflow: "hidden",
  },
  communityImage: {
    width: "100%",
    height: 180,
  },
  communityInfo: {
    padding: theme.spacing.lg,
  },
  communityName: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  apartmentDetails: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  ownershipType: {
    fontSize: 13,
    color: theme.colors.primary.blue,
    marginTop: 6,
    fontFamily: theme.typography.fonts.medium,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    color: theme.colors.text.tertiary,
    fontFamily: theme.typography.fonts.regular,
  },
  memberList: {
    gap: theme.spacing.md,
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.input,
    padding: theme.spacing.base,
    ...theme.shadows.xs,
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.full,
  },
  memberPlaceholder: {
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  memberInitial: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  memberInfo: {
    marginLeft: theme.spacing.md,
  },
  memberName: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
  },
  memberType: {
    fontSize: 13,
    color: theme.colors.text.tertiary,
  },
  card: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  rentText: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.primary.blue,
  },
  rentSubText: {
    fontSize: 14,
    color: theme.colors.text.secondary,
    marginTop: 4,
  },
  rentStatus: {
    fontSize: 13,
    color: theme.colors.status.success,
    marginTop: 6,
  },
  roomCard: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.xs,
  },
  roomName: {
    fontSize: 15,
    fontFamily: theme.typography.fonts.semiBold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  accessoriesList: {
    marginTop: theme.spacing.xs,
  },
  accessoryItem: {
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
});
