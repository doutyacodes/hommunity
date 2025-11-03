// ============================================
// FILE: services/notificationService.js
// Firebase Cloud Messaging (FCM) Notification Service
// Handles: Registration, Listeners, Deep Links, Foreground/Background
// ============================================
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * Notification Service - Complete FCM Integration
 * Works with Expo SDK 54 and App Router
 */
class NotificationService {
  constructor() {
    this.notificationListener = null;
    this.responseListener = null;
    this.expoPushToken = null;
    this.fcmToken = null;

    // Configure notification handler (determines behavior in foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,     // Show alert in foreground
        shouldPlaySound: true,      // Play sound
        shouldSetBadge: true,       // Update badge count
      }),
    });

    console.log('📱 NotificationService initialized');
  }

  /**
   * Register for push notifications and get FCM token
   * Call this after user authentication
   * @returns {Promise<Object>} { success, expoPushToken, fcmToken, error }
   */
  async registerForPushNotifications() {
    try {
      console.log('🔔 Starting push notification registration...');

      // Step 1: Check if device is physical (not simulator)
      if (!Device.isDevice) {
        console.warn('⚠️ Push notifications only work on physical devices');
        return {
          success: false,
          error: 'Push notifications only work on physical devices',
          expoPushToken: null,
          fcmToken: null,
        };
      }

      console.log('✅ Device is physical, proceeding...');

      // Step 2: Request notification permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      console.log('📋 Current permission status:', existingStatus);

      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('🔐 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        console.log('📋 New permission status:', finalStatus);
      }

      if (finalStatus !== 'granted') {
        console.error('❌ Notification permissions denied');
        return {
          success: false,
          error: 'Notification permissions not granted',
          expoPushToken: null,
          fcmToken: null,
        };
      }

      console.log('✅ Notification permissions granted');

      // Step 3: Get Expo Push Token
      try {
        console.log('🎫 Getting Expo Push Token...');

        const projectId = '9ef083b7-d4f6-43fb-8587-2e32bb87c9d0'; // From app.json

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: projectId,
        });

        this.expoPushToken = tokenData.data;
        console.log('✅ Expo Push Token:', this.expoPushToken);
      } catch (expoPushError) {
        console.error('❌ Error getting Expo Push Token:', expoPushError);
        // Continue to get FCM token even if Expo token fails
      }

      // Step 4: Get FCM Token (Android)
      if (Platform.OS === 'android') {
        try {
          console.log('🔥 Getting FCM Token (Android)...');

          // Get FCM token using Expo Notifications
          const fcmToken = await Notifications.getDevicePushTokenAsync();
          this.fcmToken = fcmToken.data;

          console.log('✅ FCM Token:', this.fcmToken);
        } catch (fcmError) {
          console.error('❌ Error getting FCM Token:', fcmError);
        }
      }

      // Step 5: Configure Android notification channel
      if (Platform.OS === 'android') {
        console.log('📢 Setting up Android notification channel...');

        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
          sound: 'notification.wav', // Optional: custom sound
          enableVibrate: true,
          showBadge: true,
        });

        // Create additional channels for different notification types
        await Notifications.setNotificationChannelAsync('guest-arrival', {
          name: 'Guest Arrivals',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'notification.wav',
          enableVibrate: true,
          showBadge: true,
        });

        await Notifications.setNotificationChannelAsync('delivery', {
          name: 'Deliveries',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#F59E0B',
          sound: 'notification.wav',
          enableVibrate: true,
          showBadge: true,
        });

        console.log('✅ Android notification channels configured');
      }

      console.log('🎉 Push notification registration complete!');

      return {
        success: true,
        expoPushToken: this.expoPushToken,
        fcmToken: this.fcmToken,
        error: null,
      };

    } catch (error) {
      console.error('❌ Push notification registration error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack,
      });

      return {
        success: false,
        error: error.message || 'Failed to register for push notifications',
        expoPushToken: null,
        fcmToken: null,
      };
    }
  }

  /**
   * Initialize notification listeners
   * Call this in _layout.jsx
   * @param {Function} onNotificationReceived - Callback when notification received
   * @param {Function} onNotificationOpened - Callback when notification opened
   */
  initializeListeners(onNotificationReceived, onNotificationOpened) {
    console.log('👂 Initializing notification listeners...');

    try {
      // Listener for notifications received while app is in FOREGROUND
      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('📨 Notification received (FOREGROUND):', notification);
          console.log('Notification data:', notification.request.content.data);
          console.log('Notification title:', notification.request.content.title);
          console.log('Notification body:', notification.request.content.body);

          if (onNotificationReceived) {
            onNotificationReceived(notification);
          }
        }
      );

      // Listener for when user TAPS on notification (opens app)
      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('👆 Notification tapped (OPENED APP):', response);
          console.log('📦 Full notification response:', JSON.stringify(response, null, 2));
          console.log('📍 Response data:', response.notification.request.content.data);
          console.log('🎯 Notification title:', response.notification.request.content.title);
          console.log('📄 Notification body:', response.notification.request.content.body);

          const notificationData = response.notification.request.content.data;

          // Log navigation intent
          if (notificationData && notificationData.screen) {
            console.log(`🚀 Will navigate to: /${notificationData.screen}`);
            console.log('📝 With params:', JSON.stringify(notificationData, null, 2));
          } else {
            console.warn('⚠️ No screen specified in notification data!');
          }

          // REMOVED: handleNotificationDeepLink() call
          // Reason: Linking.openURL() conflicts with expo-router navigation
          // Navigation is now handled by NotificationContext via onNotificationOpened callback
          // this.handleNotificationDeepLink(notificationData);

          if (onNotificationOpened) {
            console.log('✅ Calling onNotificationOpened callback...');
            onNotificationOpened(response);
          } else {
            console.error('❌ onNotificationOpened callback not defined!');
          }
        }
      );

      console.log('✅ Notification listeners initialized');

      return {
        success: true,
        notificationListener: this.notificationListener,
        responseListener: this.responseListener,
      };

    } catch (error) {
      console.error('❌ Error initializing listeners:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle deep linking from notifications
   * Supports hommunity:// scheme
   * @param {Object} data - Notification data
   */
  handleNotificationDeepLink(data) {
    try {
      console.log('🔗 Handling notification deep link...', data);

      if (!data) {
        console.log('⚠️ No data in notification');
        return;
      }

      // Extract deep link information
      const { type, screen, params } = data;

      if (type && screen) {
        // Build deep link URL
        let deepLinkUrl = `hommunity://${screen}`;

        // Add query parameters if present
        if (params && typeof params === 'object') {
          const queryString = Object.keys(params)
            .map((key) => `${key}=${encodeURIComponent(params[key])}`)
            .join('&');

          if (queryString) {
            deepLinkUrl += `?${queryString}`;
          }
        }

        console.log('🚀 Opening deep link:', deepLinkUrl);
        Linking.openURL(deepLinkUrl).catch((err) => {
          console.error('❌ Error opening deep link:', err);
        });
      } else {
        console.log('⚠️ No screen specified in notification data');
      }

    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  /**
   * Parse deep link URL
   * @param {string} url - Deep link URL (e.g., hommunity://guest-waiting?guestId=123)
   * @returns {Object} { screen, params }
   */
  parseDeepLink(url) {
    try {
      console.log('🔍 Parsing deep link:', url);

      const parsed = Linking.parse(url);

      console.log('Parsed deep link:', {
        scheme: parsed.scheme,
        hostname: parsed.hostname,
        path: parsed.path,
        queryParams: parsed.queryParams,
      });

      return {
        screen: parsed.hostname || parsed.path,
        params: parsed.queryParams || {},
      };

    } catch (error) {
      console.error('❌ Error parsing deep link:', error);
      return { screen: null, params: {} };
    }
  }

  /**
   * Get last notification response (when app opened from killed state)
   * Call this in _layout.jsx on mount
   * @returns {Promise<Object|null>} Notification response or null
   */
  async getLastNotificationResponse() {
    try {
      console.log('🔍 Checking for last notification response...');
      console.log('🕐 Timestamp:', new Date().toISOString());

      const response = await Notifications.getLastNotificationResponseAsync();

      if (response) {
        console.log('📬 Found last notification response!');
        console.log('📦 Full response:', JSON.stringify(response, null, 2));
        console.log('📍 Notification data:', response.notification.request.content.data);
        console.log('🎯 Notification title:', response.notification.request.content.title);
        console.log('📄 Notification body:', response.notification.request.content.body);

        const data = response.notification.request.content.data;
        if (data && data.screen) {
          console.log(`🚀 App was opened with intent to navigate to: /${data.screen}`);
        }

        return response;
      } else {
        console.log('📭 No last notification response found (app opened normally)');
        return null;
      }

    } catch (error) {
      console.error('❌ Error getting last notification response:', error);
      console.error('Error details:', error.message, error.stack);
      return null;
    }
  }

  /**
   * Schedule a local notification (for testing)
   * @param {Object} options - Notification options
   * @returns {Promise<string>} Notification ID
   */
  async scheduleLocalNotification(options = {}) {
    try {
      const {
        title = 'Test Notification',
        body = 'This is a test notification',
        data = {},
        seconds = 1,
      } = options;

      console.log('📅 Scheduling local notification...');

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'notification.wav',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: { seconds },
      });

      console.log('✅ Local notification scheduled:', notificationId);
      return notificationId;

    } catch (error) {
      console.error('❌ Error scheduling local notification:', error);
      throw error;
    }
  }

  /**
   * Present a local notification immediately
   * @param {Object} options - Notification options
   */
  async presentLocalNotification(options = {}) {
    try {
      const {
        title = 'Notification',
        body = 'You have a new update',
        data = {},
        channelId = 'default',
      } = options;

      console.log('🔔 Presenting local notification...');

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'notification.wav',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          channelId, // Android only
        },
        trigger: null, // null = show immediately
      });

      console.log('✅ Local notification presented');

    } catch (error) {
      console.error('❌ Error presenting local notification:', error);
      throw error;
    }
  }

  /**
   * Get badge count
   * @returns {Promise<number>} Badge count
   */
  async getBadgeCount() {
    try {
      const count = await Notifications.getBadgeCountAsync();
      console.log('🔢 Badge count:', count);
      return count;
    } catch (error) {
      console.error('❌ Error getting badge count:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   * @param {number} count - Badge count
   */
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      console.log('✅ Badge count set to:', count);
    } catch (error) {
      console.error('❌ Error setting badge count:', error);
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('✅ All notifications cleared');
    } catch (error) {
      console.error('❌ Error clearing notifications:', error);
    }
  }

  /**
   * Remove notification listeners
   * Call this when component unmounts
   */
  removeListeners() {
    try {
      console.log('🗑️ Removing notification listeners...');

      if (this.notificationListener) {
        Notifications.removeNotificationSubscription(this.notificationListener);
        this.notificationListener = null;
      }

      if (this.responseListener) {
        Notifications.removeNotificationSubscription(this.responseListener);
        this.responseListener = null;
      }

      console.log('✅ Notification listeners removed');

    } catch (error) {
      console.error('❌ Error removing listeners:', error);
    }
  }

  /**
   * Get current FCM token
   * @returns {string|null} FCM token
   */
  getFcmToken() {
    return this.fcmToken;
  }

  /**
   * Get current Expo Push Token
   * @returns {string|null} Expo push token
   */
  getExpoPushToken() {
    return this.expoPushToken;
  }

  /**
   * Check if notifications are enabled
   * @returns {Promise<boolean>} True if enabled
   */
  async areNotificationsEnabled() {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Error checking notification status:', error);
      return false;
    }
  }
}

// Export singleton instance
export default new NotificationService();

// Also export the class for testing
export { NotificationService };
