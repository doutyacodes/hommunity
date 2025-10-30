// ============================================
// FILE: contexts/NotificationContext.jsx
// Notification Context Provider for Global State Management
// ============================================
import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '@/services/notificationService';
import * as Linking from 'expo-linking';
import { useRouter, useSegments } from 'expo-router';

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

  // Initialize notifications on mount
  useEffect(() => {
    console.log('🚀 NotificationContext: Initializing...');
    initializeNotifications();

    // Check for notification that opened the app
    checkInitialNotification();

    // Handle deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      console.log('🧹 NotificationContext: Cleaning up...');
      subscription.remove();
      notificationService.removeListeners();
    };
  }, []);

  /**
   * Initialize notification system
   */
  const initializeNotifications = async () => {
    try {
      console.log('🔧 Setting up notification listeners...');

      // Initialize listeners
      notificationService.initializeListeners(
        handleNotificationReceived,
        handleNotificationOpened
      );

      console.log('✅ Notification listeners set up');

    } catch (err) {
      console.error('❌ Error initializing notifications:', err);
      setError(err.message);
    }
  };

  /**
   * Check if app was opened by a notification
   */
  const checkInitialNotification = async () => {
    try {
      console.log('🔍 Checking for initial notification...');

      const response = await notificationService.getLastNotificationResponse();

      if (response) {
        console.log('📬 App opened from notification');
        const data = response.notification.request.content.data;
        handleNotificationOpened(response);
      }

    } catch (err) {
      console.error('❌ Error checking initial notification:', err);
    }
  };

  /**
   * Handle notification received while app is open (foreground)
   */
  const handleNotificationReceived = (notification) => {
    console.log('📨 Notification received in context:', notification);
    setNotification(notification);
    setNotificationData(notification.request.content.data);

    // You can show an in-app alert here if needed
    // Or update badge count, etc.
  };

  /**
   * Handle notification opened (user tapped)
   */
  const handleNotificationOpened = (response) => {
    console.log('👆 Notification opened in context:', response);

    const data = response.notification.request.content.data;
    setNotificationData(data);

    // Navigate based on notification type
    navigateFromNotification(data);
  };

  /**
   * Navigate based on notification data
   */
  const navigateFromNotification = (data) => {
    try {
      console.log('🧭 Navigating from notification:', data);

      if (!data || !data.screen) {
        console.log('⚠️ No screen specified in notification');
        return;
      }

      const { screen, type, ...params } = data;

      // Wait a bit to ensure app is fully loaded
      setTimeout(() => {
        try {
          // Build the route with params
          let route = `/${screen}`;

          // Add query params if present
          const queryParams = Object.keys(params)
            .filter((key) => params[key] !== undefined && params[key] !== null)
            .map((key) => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');

          if (queryParams) {
            route += `?${queryParams}`;
          }

          console.log('📍 Navigating to:', route);

          // Use router to navigate
          router.push(route);

        } catch (navError) {
          console.error('❌ Navigation error:', navError);
        }
      }, 500);

    } catch (err) {
      console.error('❌ Error navigating from notification:', err);
    }
  };

  /**
   * Handle deep link
   */
  const handleDeepLink = (event) => {
    try {
      console.log('🔗 Deep link received:', event.url);

      const { screen, params } = notificationService.parseDeepLink(event.url);

      if (screen) {
        navigateFromNotification({ screen, ...params });
      }

    } catch (err) {
      console.error('❌ Error handling deep link:', err);
    }
  };

  /**
   * Register for push notifications
   */
  const registerForNotifications = async () => {
    try {
      console.log('📝 Registering for notifications...');

      const result = await notificationService.registerForPushNotifications();

      if (result.success) {
        setExpoPushToken(result.expoPushToken);
        setFcmToken(result.fcmToken);
        setIsRegistered(true);
        setError(null);

        console.log('✅ Registration successful');
        console.log('Expo Token:', result.expoPushToken);
        console.log('FCM Token:', result.fcmToken);

        return result;
      } else {
        setError(result.error);
        console.error('❌ Registration failed:', result.error);
        return result;
      }

    } catch (err) {
      console.error('❌ Registration error:', err);
      setError(err.message);
      return {
        success: false,
        error: err.message,
      };
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
   * Send test notification (for debugging)
   */
  const sendTestNotification = async () => {
    try {
      console.log('🧪 Sending test notification...');

      await notificationService.presentLocalNotification({
        title: 'Test Notification',
        body: 'This is a test from Hommunity!',
        data: {
          type: 'test',
          screen: 'user/home',
          timestamp: Date.now(),
        },
        channelId: 'default',
      });

      console.log('✅ Test notification sent');

    } catch (err) {
      console.error('❌ Error sending test notification:', err);
    }
  };

  const value = {
    // Tokens
    expoPushToken,
    fcmToken,
    isRegistered,

    // Notification data
    notification,
    notificationData,

    // Error
    error,

    // Functions
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
    throw new Error('useNotification must be used within NotificationProvider');
  }

  return context;
}

export default NotificationContext;
