// ============================================
// FILE: contexts/NotificationContext.jsx
// Notification Context Provider for Global State Management
//
// IMPROVEMENTS:
// ✅ Router readiness detection with timeout (10s max)
// ✅ Navigation interval tracking with timeout (6s max)
// ✅ Proper interval cleanup to prevent memory leaks
// ✅ Handles rapid notification taps gracefully
// ✅ AppState listener for background -> foreground transitions
// ============================================

import notificationService from "@/services/notificationService";
import * as Linking from "expo-linking";
import { useRouter, useSegments } from "expo-router";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const router = useRouter();
  const segments = useSegments();

  const [expoPushToken, setExpoPushToken] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [notificationData, setNotificationData] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState(null);
  const [readyToNavigate, setReadyToNavigate] = useState(false);
  const appState = useRef(AppState.currentState);
  const navigationIntervalRef = useRef(null); // Track navigation interval for cleanup
  const routerCheckIntervalRef = useRef(null); // Track router check interval for cleanup

  // Initialize notifications on mount
  useEffect(() => {
    console.log("🚀 NotificationContext: Initializing...");
    initializeNotifications();

    // Wait for expo-router to be ready with timeout protection
    let routerCheckAttempts = 0;
    const maxRouterCheckAttempts = 33; // 10 seconds max (33 * 300ms)

    routerCheckIntervalRef.current = setInterval(() => {
      routerCheckAttempts++;

      // Check if router is functional and segments are available
      if (router && typeof router.push === 'function' && segments !== undefined) {
        // Router is ready (segments can be empty array for root routes)
        console.log("✅ Expo Router ready, navigation enabled");
        setReadyToNavigate(true);
        clearInterval(routerCheckIntervalRef.current);
        routerCheckIntervalRef.current = null;
        checkInitialNotification(); // Now safe to call
      } else if (routerCheckAttempts >= maxRouterCheckAttempts) {
        // Timeout reached, assume router is ready
        console.warn("⚠️ Router check timeout (10s), assuming ready and proceeding");
        setReadyToNavigate(true);
        clearInterval(routerCheckIntervalRef.current);
        routerCheckIntervalRef.current = null;
        checkInitialNotification(); // Try anyway
      }
    }, 300);

    // Handle deep links
    const subscription = Linking.addEventListener("url", handleDeepLink);

    return () => {
      console.log("🧹 NotificationContext: Cleaning up...");
      subscription.remove();
      notificationService.removeListeners();

      // Clean up router check interval
      if (routerCheckIntervalRef.current) {
        clearInterval(routerCheckIntervalRef.current);
        routerCheckIntervalRef.current = null;
      }

      // Clean up navigation interval
      if (navigationIntervalRef.current) {
        clearInterval(navigationIntervalRef.current);
        navigationIntervalRef.current = null;
      }
    };
  }, []);

  // Listen for app state changes (background <-> foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        console.log("📱 App has come to the foreground!");
        checkInitialNotification();
      }

      appState.current = nextAppState;
      console.log("AppState:", appState.current);
    });

    return () => subscription.remove();
  }, []);

  /**
   * Initialize notification system
   */
  const initializeNotifications = async () => {
    try {
      console.log("🔧 Setting up notification listeners...");

      // Initialize listeners
      notificationService.initializeListeners(
        handleNotificationReceived,
        handleNotificationOpened
      );

      console.log("✅ Notification listeners set up");
    } catch (err) {
      console.error("❌ Error initializing notifications:", err);
      setError(err.message);
    }
  };

  /**
   * Check if app was opened by a notification
   */
  const checkInitialNotification = async () => {
    try {
      console.log("🔍 Checking for initial notification...");

      const response = await notificationService.getLastNotificationResponse();

      if (response) {
        console.log("📬 App opened from notification");
        handleNotificationOpened(response);
      }
    } catch (err) {
      console.error("❌ Error checking initial notification:", err);
    }
  };

  /**
   * Handle notification received while app is open (foreground)
   */
  const handleNotificationReceived = (notification) => {
    console.log("📨 Notification received in context:", notification);
    setNotification(notification);
    setNotificationData(notification.request.content.data);
  };

  /**
   * Handle notification opened (user tapped)
   */
  const handleNotificationOpened = (response) => {
    console.log("👆 Notification opened in context:", response);
    const data = response.notification?.request?.content?.data;

    if (!data) {
      console.warn("⚠️ No data found in opened notification");
      return;
    }

    setNotificationData(data);

    // Clear any existing navigation interval to prevent multiple intervals
    if (navigationIntervalRef.current) {
      clearInterval(navigationIntervalRef.current);
      navigationIntervalRef.current = null;
      console.log("🧹 Cleared existing navigation interval");
    }

    // Wait for router readiness before navigating with timeout protection
    let attempts = 0;
    const maxAttempts = 20; // 6 seconds max (20 * 300ms)

    navigationIntervalRef.current = setInterval(() => {
      attempts++;

      if (readyToNavigate) {
        // Router is ready, navigate
        clearInterval(navigationIntervalRef.current);
        navigationIntervalRef.current = null;
        console.log("✅ Router ready, navigating...");
        navigateFromNotification(data);
      } else if (attempts >= maxAttempts) {
        // Timeout reached, try navigating anyway
        clearInterval(navigationIntervalRef.current);
        navigationIntervalRef.current = null;
        console.warn("⚠️ Navigation timeout (6s), forcing navigation attempt");
        navigateFromNotification(data);
      }
    }, 300);
  };

  /**
   * Navigate based on notification data
   */
  const navigateFromNotification = (data) => {
    try {
      console.log("🧭 Navigating from notification:", data);

      if (!data || !data.screen) {
        console.log("⚠️ No screen specified in notification");
        return;
      }

      const { screen, type, ...params } = data;

      // Delay a bit to ensure app readiness
      setTimeout(() => {
        try {
          let route = `/${screen}`;

          // Add query params if present
          const queryParams = Object.keys(params)
            .filter((key) => params[key] !== undefined && params[key] !== null)
            .map((key) => `${key}=${encodeURIComponent(params[key])}`)
            .join("&");

          if (queryParams) route += `?${queryParams}`;

          console.log("📍 Navigating to:", route);

          router.push(route);
        } catch (navError) {
          console.error("❌ Navigation error:", navError);
        }
      }, 500);
    } catch (err) {
      console.error("❌ Error navigating from notification:", err);
    }
  };

  /**
   * Handle deep link
   */
  const handleDeepLink = (event) => {
    try {
      console.log("🔗 Deep link received:", event.url);
      const { screen, params } = notificationService.parseDeepLink(event.url);
      if (screen) navigateFromNotification({ screen, ...params });
    } catch (err) {
      console.error("❌ Error handling deep link:", err);
    }
  };

  /**
   * Register for push notifications
   */
  const registerForNotifications = async () => {
    try {
      console.log("📝 Registering for notifications...");
      const result = await notificationService.registerForPushNotifications();

      if (result.success) {
        setExpoPushToken(result.expoPushToken);
        setFcmToken(result.fcmToken);
        setIsRegistered(true);
        setError(null);

        console.log("✅ Registration successful");
        console.log("Expo Token:", result.expoPushToken);
        console.log("FCM Token:", result.fcmToken);
        return result;
      } else {
        setError(result.error);
        console.error("❌ Registration failed:", result.error);
        return result;
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  /**
   * Clear notification data
   */
  const clearNotificationData = () => {
    setNotification(null);
    setNotificationData(null);
  };

  /**
   * Send test notification
   */
  const sendTestNotification = async () => {
    try {
      console.log("🧪 Sending test notification...");
      await notificationService.presentLocalNotification({
        title: "Test Notification",
        body: "This is a test from Hommunity!",
        data: {
          type: "test",
          screen: "user/home",
          timestamp: Date.now(),
        },
        channelId: "default",
      });
      console.log("✅ Test notification sent");
    } catch (err) {
      console.error("❌ Error sending test notification:", err);
    }
  };

  const value = {
    expoPushToken,
    fcmToken,
    isRegistered,
    notification,
    notificationData,
    error,
    registerForNotifications,
    clearNotificationData,
    sendTestNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Hook to use notification context
 */
export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return context;
}

export default NotificationContext;
