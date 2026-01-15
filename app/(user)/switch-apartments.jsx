import SafeAreaWrapper from "@/components/SafeAreaWrapper";
import { API_ENDPOINTS, buildApiUrl, getApiHeaders } from "@/config/apiConfig";
import { useApartment } from "@/providers/ApartmentProvider";
import { getAuthToken } from "@/services/authService";
import theme from "@/theme";
import { Home } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SwitchApartment() {
  const { currentApartment, refreshApartment } = useApartment();
  const [apartments, setApartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState(null); // ✅ Changed from boolean to ID

  useEffect(() => {
    (async () => {
      const token = await getAuthToken();
      const res = await fetch(buildApiUrl(API_ENDPOINTS.GET_MY_APARTMENTS), {
        method: "GET",
        headers: getApiHeaders(token),
      });
      console.log("🔹 Switch Apartments response status:", res.status);

      const data = await res.json();
      console.log("🔹 Switch Apartments response data:", data);

      if (data.success) {
        const allApartments = [
          ...(data.data.owned || []),
          ...(data.data.rented || [])
        ];
        setApartments(allApartments);
      }
      setLoading(false);
    })();
  }, []);

  const handleSwitch = async (apartmentId) => {
    setSwitchingId(apartmentId); // ✅ Set the specific apartment ID
    const token = await getAuthToken();

    const res = await fetch(buildApiUrl(API_ENDPOINTS.SWITCH_APARTMENT), {
      method: "POST",
      headers: getApiHeaders(token),
      body: JSON.stringify({ apartmentId }),
    });
    const data = await res.json();
    setSwitchingId(null); // ✅ Clear switching state

    if (data.success) {
      await refreshApartment();
      alert("✅ Apartment switched successfully!");
    } else {
      alert("❌ " + (data.message || "Failed to switch apartment"));
    }
  };

  if (loading)
    return (
      <SafeAreaWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary.blue} />
        </View>
      </SafeAreaWrapper>
    );

  return (
    <SafeAreaWrapper>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Switch Apartment</Text>

        {apartments.length === 0 ? (
          <Text style={styles.emptyText}>No apartments found.</Text>
        ) : (
          apartments.map((apt, index) => {
            const isCurrent = currentApartment?.id === apt.id;
            const isSwitching = switchingId === apt.id; // ✅ Check if THIS apartment is switching

            return (
              <View key={index} style={styles.card}>
                <View style={styles.cardLeft}>
                  <Home size={28} color={theme.colors.primary.blue} />
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.apartmentName}>
                    {apt.apartmentNumber} {apt.towerName && `, ${apt.towerName}`}
                  </Text>
                  <Text style={styles.communityName}>{apt.communityName}</Text>
                  <Text style={styles.roleText}>
                    {apt.ownershipType === "owner" ? "🏠 Owner" : "👥 Tenant"}
                  </Text>

                  <TouchableOpacity
                    disabled={isSwitching || isCurrent || switchingId !== null} // ✅ Disable all when any is switching
                    style={[
                      styles.switchButton,
                      isCurrent && styles.activeButton,
                      isSwitching && styles.switchingButton, // ✅ Optional: add different style for switching
                    ]}
                    onPress={() => handleSwitch(apt.id)}
                  >
                    <Text style={styles.switchText}>
                      {isCurrent
                        ? "Current"
                        : isSwitching
                        ? "Switching..."
                        : "Switch"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
  },
  header: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: {
    textAlign: "center",
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xl,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.sm,
  },
  cardLeft: {
    width: 50,
    height: 50,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryShades.blue100,
    justifyContent: "center",
    alignItems: "center",
  },
  cardRight: { flex: 1, marginLeft: theme.spacing.md },
  apartmentName: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.bold,
    color: theme.colors.text.primary,
  },
  communityName: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.secondary,
    marginVertical: 2,
  },
  roleText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text.tertiary,
  },
  switchButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary.blue,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.button,
    alignItems: "center",
  },
  switchText: { color: "#fff", fontFamily: theme.typography.fonts.semiBold },
  activeButton: {
    backgroundColor: theme.colors.neutral.gray400,
  },
  activeButton: {
    backgroundColor: theme.colors.neutral.gray400,
  },
  switchingButton: { // ✅ Optional: add visual feedback for switching state
    backgroundColor: theme.colors.primary.blue,
    opacity: 0.6,
  },
});
