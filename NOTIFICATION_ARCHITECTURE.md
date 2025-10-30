# 🏗️ Notification System Architecture - Hommunity

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Hommunity Mobile App                         │
│                         (Expo + React Native)                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌─────────────────────┐      ┌─────────────────────┐
         │  NotificationContext │      │ notificationService  │
         │    (Global State)    │◄─────┤    (Core Logic)      │
         └─────────────────────┘      └─────────────────────┘
                    │                             │
                    │                   ┌─────────┴─────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
         ┌─────────────────────┐  ┌──────────┐    ┌──────────┐
         │   App Components     │  │   FCM    │    │   Expo   │
         │  - user/home.jsx     │  │  Token   │    │  Token   │
         │  - guest-waiting.jsx │  │          │    │          │
         └─────────────────────┘  └──────────┘    └──────────┘
                    │                   │                   │
                    │                   └─────────┬─────────┘
                    │                             │
                    │                             ▼
                    │              ┌──────────────────────────┐
                    │              │   Backend Database       │
                    │              │   users.fcmToken         │
                    │              │   users.expoPushToken    │
                    │              └──────────────────────────┘
                    │                             │
                    ▼                             ▼
         ┌─────────────────────────────────────────────────────┐
         │              Backend API (Next.js)                   │
         │  ┌────────────────────────────────────────────┐     │
         │  │ /api/mobile-api/user/update-push-token      │     │
         │  │ - Saves FCM/Expo tokens to database        │     │
         │  └────────────────────────────────────────────┘     │
         │  ┌────────────────────────────────────────────┐     │
         │  │ /api/mobile-api/security/create-guest       │     │
         │  │ - Creates guest entry                       │     │
         │  │ - Looks up resident's tokens                │     │
         │  │ - Sends notification via fcmHelper          │     │
         │  └────────────────────────────────────────────┘     │
         │  ┌────────────────────────────────────────────┐     │
         │  │ helpers/fcmHelper.js                        │     │
         │  │ - sendFCMNotification()                     │     │
         │  │ - Supports: Firebase Admin, HTTP API, Expo │     │
         │  └────────────────────────────────────────────┘     │
         └─────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌─────────────────────┐      ┌─────────────────────┐
         │  Firebase Cloud      │      │  Expo Push          │
         │  Messaging (FCM)     │      │  Notification       │
         │                      │      │  Service            │
         └─────────────────────┘      └─────────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   User's Physical Device  │
                    │   (Push Notification)     │
                    └──────────────────────────┘
                                   │
                                   │ (User taps notification)
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   Deep Link Handler       │
                    │   hommunity://screen      │
                    └──────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │   App Router Navigation   │
                    │   /security/guest-waiting │
                    └──────────────────────────┘
```

---

## Component Breakdown

### 📱 **Mobile App Layer**

#### **1. NotificationContext.jsx**
- **Purpose:** Global notification state management
- **Responsibilities:**
  - Initialize notification listeners on app start
  - Store FCM/Expo tokens
  - Handle notification received events
  - Handle notification opened events
  - Navigate to screens via deep links
  - Provide hooks for components

#### **2. notificationService.js**
- **Purpose:** Core notification logic
- **Responsibilities:**
  - Register device for push notifications
  - Request permissions (iOS/Android)
  - Get FCM token
  - Get Expo Push Token
  - Set up notification listeners
  - Configure Android channels
  - Handle badge counts
  - Parse deep links
  - Schedule local notifications (testing)

#### **3. App Components (user/home.jsx, etc.)**
- **Purpose:** UI integration
- **Responsibilities:**
  - Call `registerForNotifications()` after login
  - Save tokens to backend
  - Display notification data
  - Navigate based on notification data

---

### 🔧 **Backend API Layer**

#### **1. /api/mobile-api/user/update-push-token**
- **Method:** POST
- **Purpose:** Save user's FCM/Expo tokens
- **Flow:**
  ```
  User Login → Register Notifications → Get Tokens → Save to DB
  ```

#### **2. /api/mobile-api/security/create-guest**
- **Method:** POST
- **Purpose:** Create guest and send notification
- **Flow:**
  ```
  Security creates guest
    ↓
  Find resident by apartmentId
    ↓
  Get resident's FCM/Expo token
    ↓
  Send notification with deep link data
    ↓
  Return success + notificationSent status
  ```

#### **3. helpers/fcmHelper.js**
- **Purpose:** Send notifications
- **Three Options:**
  1. **Firebase Admin SDK** (full control)
  2. **HTTP API** (serverless)
  3. **Expo Push** (easiest, currently active)

---

## Data Flow: Guest Arrival

```
┌────────────────────────────────────────────────────────────────┐
│ 1. Security Guard at Gate                                      │
│    - Opens "Upload Guest" screen                               │
│    - Takes photo of guest                                      │
│    - Fills form: name, apartment, vehicle, purpose             │
│    - Submits                                                   │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 2. Mobile App (Security)                                       │
│    - Uploads photo to PHP server                               │
│    - Gets filename: "guest_1730256789.jpg"                     │
│    - Calls POST /api/mobile-api/security/create-guest          │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 3. Backend API                                                 │
│    - Verifies security token                                   │
│    - Finds resident by apartmentId                             │
│    - Creates guest entry in database                           │
│    - Generates QR code: "GW-1730256789-XYZ123"                 │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 4. Notification Trigger                                        │
│    - Retrieves resident's FCM token from database              │
│    - Builds notification payload:                              │
│      {                                                          │
│        title: "🔔 New Guest Arrival",                          │
│        body: "John Doe is waiting at gate",                    │
│        data: {                                                  │
│          type: "guest_arrival",                                │
│          screen: "security/guest-waiting",                     │
│          guestId: "123",                                        │
│          apartmentId: "45"                                      │
│        }                                                        │
│      }                                                          │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 5. Send via Expo Push Service                                 │
│    POST https://exp.host/--/api/v2/push/send                   │
│    - Uses resident's expoPushToken                             │
│    - Includes notification title, body, data                   │
│    - Sets channel: "guest-arrival"                             │
│    - Priority: "high"                                          │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 6. Expo Push Service                                           │
│    - Routes to FCM (Android) or APNs (iOS)                     │
│    - Delivers to resident's device                             │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 7. Resident's Device                                           │
│    - Receives push notification                                │
│    - Shows in notification tray                                │
│    - Plays sound + vibration                                   │
│    - Updates badge count                                       │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 8. User Taps Notification                                      │
│    - Opens Hommunity app                                       │
│    - Triggers notificationResponseListener                     │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 9. Deep Link Handler (NotificationContext)                    │
│    - Extracts data: { screen: "security/guest-waiting", ... } │
│    - Builds route: "/security/guest-waiting?guestId=123"      │
│    - Calls router.push()                                       │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 10. App Navigation (Expo Router)                              │
│    - Navigates to /security/guest-waiting                      │
│    - Passes params: { guestId: 123, apartmentId: 45, ... }    │
└────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│ 11. Guest Waiting Screen                                      │
│    - Receives route params                                     │
│    - Fetches guest details from API                            │
│    - Displays guest info                                       │
│    - Shows approve/deny buttons                                │
│    - 🎉 Complete!                                              │
└────────────────────────────────────────────────────────────────┘
```

---

## Token Registration Flow

```
User Opens App
    │
    ▼
App Launch (_layout.jsx)
    │
    ▼
NotificationProvider Initializes
    │
    ├─► Sets up listeners
    │   - addNotificationReceivedListener
    │   - addNotificationResponseReceivedListener
    │
    └─► Checks for initial notification
        (app opened from killed state)
    │
    ▼
User Logs In
    │
    ▼
User Home Screen Loads
    │
    ▼
Calls registerForNotifications()
    │
    ├─► Check if physical device
    │   └─► If simulator → Return error
    │
    ├─► Request permissions
    │   ├─► iOS: Alert dialog
    │   └─► Android: System dialog
    │
    ├─► Get Expo Push Token
    │   └─► Returns: ExponentPushToken[...]
    │
    ├─► Get FCM Token (Android)
    │   └─► Returns: fFZ...
    │
    ├─► Configure Android Channels
    │   ├─► default
    │   ├─► guest-arrival
    │   └─► delivery
    │
    └─► Return both tokens
    │
    ▼
Save Tokens to Backend
    │
    ├─► POST /api/mobile-api/user/update-push-token
    │   └─► { fcmToken, expoPushToken }
    │
    └─► Database UPDATE
        └─► users.fcmToken = "..."
        └─► users.expoPushToken = "..."
    │
    ▼
✅ Ready to Receive Notifications!
```

---

## Deep Link Routing

### **URL Scheme:** `hommunity://`

### **Format:**
```
hommunity://<screen>?<param1>=<value1>&<param2>=<value2>
```

### **Examples:**

| Deep Link | Screen | Params |
|-----------|--------|--------|
| `hommunity://security/guest-waiting?guestId=123` | `/security/guest-waiting` | `{ guestId: "123" }` |
| `hommunity://user/home` | `/user/home` | `{}` |
| `hommunity://security/scan-qr` | `/security/scan-qr` | `{}` |

### **Implementation:**

1. **Notification includes data:**
   ```json
   {
     "type": "guest_arrival",
     "screen": "security/guest-waiting",
     "guestId": "123",
     "apartmentId": "45"
   }
   ```

2. **NotificationContext extracts data:**
   ```javascript
   const { screen, type, ...params } = notificationData;
   ```

3. **Builds route:**
   ```javascript
   let route = `/${screen}`;
   if (params) {
     route += `?guestId=123&apartmentId=45`;
   }
   ```

4. **Navigates:**
   ```javascript
   router.push(route);
   ```

---

## State Management

### **NotificationContext provides:**

```javascript
const {
  // Tokens
  expoPushToken,      // Expo Push Token
  fcmToken,           // Firebase Cloud Messaging token
  isRegistered,       // Boolean: registration complete

  // Notification data
  notification,       // Current notification object
  notificationData,   // Extracted data from notification

  // Error
  error,              // Error message if any

  // Functions
  registerForNotifications,  // Register device
  clearNotificationData,     // Clear notification state
  sendTestNotification,      // Send test (debugging)
} = useNotification();
```

### **Usage in components:**

```javascript
import { useNotification } from '@/contexts/NotificationContext';

function MyComponent() {
  const { registerForNotifications, notificationData } = useNotification();

  useEffect(() => {
    // Register on mount
    registerForNotifications();
  }, []);

  // Access notification data
  if (notificationData?.type === 'guest_arrival') {
    // Handle guest arrival
  }
}
```

---

## File Structure

```
hommunity/
├── app/
│   ├── _layout.jsx                    ← NotificationProvider wrapper
│   ├── index.jsx                      ← Onboarding
│   ├── user/
│   │   └── home.jsx                   ← Registers notifications
│   └── security/
│       └── guest-waiting.jsx          ← Deep link target
│
├── contexts/
│   └── NotificationContext.jsx        ← Global state
│
├── services/
│   ├── notificationService.js         ← Core logic
│   ├── authService.js
│   └── securityService.js
│
├── mobile-api/
│   ├── helpers/
│   │   └── fcmHelper.js               ← Send notifications
│   ├── user/
│   │   └── update-push-token/
│   │       └── route.js               ← Save tokens
│   └── security/
│       └── create-guest/
│           └── route.js               ← Trigger notification
│
├── config/
│   └── apiConfig.js                   ← API endpoints
│
├── schema.js                          ← Database schema
├── app.json                           ← Expo config
├── google-services.json               ← Firebase config
│
└── Documentation/
    ├── NOTIFICATIONS_SETUP.md         ← Full guide
    ├── QUICK_START_NOTIFICATIONS.md   ← Quick reference
    ├── FCM_IMPLEMENTATION_SUMMARY.md  ← Summary
    └── NOTIFICATION_ARCHITECTURE.md   ← This file
```

---

## Android Notification Channels

| Channel ID | Name | Priority | Use Case |
|------------|------|----------|----------|
| `default` | Default | MAX | General notifications |
| `guest-arrival` | Guest Arrivals | HIGH | Guest waiting at gate ⭐ |
| `delivery` | Deliveries | HIGH | Package deliveries |

### **Channel Configuration:**
```javascript
{
  name: 'Guest Arrivals',
  importance: Notifications.AndroidImportance.HIGH,
  vibrationPattern: [0, 250, 250, 250],
  lightColor: '#10B981',
  sound: 'notification.wav',
  enableVibrate: true,
  showBadge: true,
}
```

---

## Security Considerations

1. **Token Storage:**
   - Tokens stored in database (VARCHAR 500)
   - Linked to user account
   - Updated on each login

2. **Authentication:**
   - All API calls require Bearer token
   - JWT verification before accessing tokens
   - User type validation (security/user)

3. **Data Privacy:**
   - Only resident of apartment receives notification
   - Guest details not exposed in notification body
   - Sensitive data in `data` field (not displayed in tray)

4. **Error Handling:**
   - Graceful failures (notification error doesn't block request)
   - Logging for debugging
   - User feedback on failures

---

## Performance Optimizations

1. **Lazy Token Registration:**
   - Only register after successful login
   - Cache tokens in context
   - Avoid re-registration on every mount

2. **Efficient Listeners:**
   - Single listener for all notification types
   - Cleanup on unmount
   - Singleton service instance

3. **Deep Link Optimization:**
   - Parse URL once
   - Cache parsed data
   - Debounce navigation calls

---

## Testing Strategy

### **Unit Tests:**
- Token generation
- Permission handling
- Deep link parsing
- Notification data extraction

### **Integration Tests:**
- End-to-end guest arrival flow
- Token save to database
- Notification sending
- Deep link navigation

### **Manual Tests:**
- Physical device testing
- Foreground/background/killed state
- Android & iOS
- Different notification types

---

## Monitoring & Logging

### **Console Logs Include:**

- 📱 Token/Device operations
- 🔔 Notification received
- 👆 Notification tapped
- ✅ Success operations
- ❌ Errors
- 🔗 Deep links
- 📤 Notification sending
- 🎫 Token generation

### **Example Log Flow:**
```
🚀 NotificationContext: Initializing...
🔧 Setting up notification listeners...
👂 Initializing notification listeners...
✅ Notification listeners set up
📝 Registering for notifications...
🔔 Starting push notification registration...
✅ Device is physical, proceeding...
📋 Current permission status: granted
✅ Notification permissions granted
🎫 Getting Expo Push Token...
✅ Expo Push Token: ExponentPushToken[...]
🔥 Getting FCM Token (Android)...
✅ FCM Token: fFZ...
📢 Setting up Android notification channel...
✅ Android notification channels configured
🎉 Push notification registration complete!
✅ Notifications registered successfully
✅ Push tokens saved to backend
```

---

## Future Enhancements

- [ ] Notification history/inbox
- [ ] Notification preferences per user
- [ ] Batch notifications
- [ ] Silent/data-only notifications
- [ ] Scheduled notifications
- [ ] Notification analytics
- [ ] Push to multiple devices per user
- [ ] Rich notifications (images, actions)
- [ ] Notification sound customization
- [ ] Do Not Disturb scheduling

---

**Architecture designed for:**
- ✅ Scalability
- ✅ Maintainability
- ✅ Testability
- ✅ Production readiness
- ✅ Expo SDK 54 compatibility
- ✅ App Router integration
