import { API_ENDPOINTS, buildApiUrl } from "@/config/apiConfig";
import { getAuthToken } from "@/services/authService";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ---------------------------------------------
// Context Creation
// ---------------------------------------------
const ApartmentContext = createContext(null);

// ---------------------------------------------
// Provider Component
// ---------------------------------------------
export const ApartmentProvider = ({ children }) => {
  const [currentApartment, setCurrentApartment] = useState(null);
  const [userApartments, setUserApartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Derived state — useful for checks
  const isApartmentAvailable = !!currentApartment; // true if user has one
  const hasMultipleApartments = userApartments.length > 1;

  // Fetch current apartment details
  const fetchCurrentApartment = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      if (!token) {
        setCurrentApartment(null);
        setUserApartments([]);
        return;
      }

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.GET_CURRENT_APARTMENT),
        {
          method: "POST", // ✅ Back to POST
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Still use header auth
          },
          // No body needed since token is in header
        }
      );

      const data = await response.json();
      console.log("🔹 Current Apartment Provider response:", data);

      if (data.success && data.apartment) {
        setCurrentApartment(data.apartment);
        setUserApartments(data.allApartments || []);
      } else {
        // no apartment found
        setCurrentApartment(null);
        setUserApartments([]);
      }
    } catch (err) {
      console.error("❌ Error fetching current apartment:", err);
      setCurrentApartment(null);
      setUserApartments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentApartment();
  }, [fetchCurrentApartment]);

  // Allow manual refresh (for pull-to-refresh or switching apartments)
  const refreshApartment = async () => {
    await fetchCurrentApartment();
  };

  // Expose values globally
  return (
    <ApartmentContext.Provider
      value={{
        currentApartment,
        userApartments,
        loading,
        isApartmentAvailable,
        hasMultipleApartments,
        refreshApartment,
        setCurrentApartment,
        setUserApartments,
      }}
    >
      {children}
    </ApartmentContext.Provider>
  );
};

// ---------------------------------------------
// Custom Hook for easy access
// ---------------------------------------------
export const useApartment = () => useContext(ApartmentContext);
