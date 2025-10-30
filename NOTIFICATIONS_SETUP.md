# 🔔 Firebase Cloud Messaging (FCM) Setup Guide - Hommunity

Complete implementation of push notifications using Firebase Cloud Messaging with Expo Notifications.

---

## ✅ What's Been Implemented

### 1. **Core Files Created**

#### **Services**
- ✅ `services/notificationService.js` - Complete FCM service with:
  - Device token registration (FCM + Expo Push Token)
  - Notification listeners (foreground, background, killed state)
  - Deep link handling with `hommunity://` scheme
  - Badge count management
  - Android notification channels
  - Full error handling and logging

#### **Contexts**
- ✅ `contexts/NotificationContext.jsx` - React Context for global state:
  - Token management (FCM & Expo)
  - Notification state
  - Deep link navigation
  - Auto-initialization

#### **API Routes**
- ✅ `mobile-api/security/create-guest/route.js` - Sends notifications when guest arrives
- ✅ `mobile-api/user/update-push-token/route.js` - Saves user tokens to database
- ✅ `mobile-api/helpers/fcmHelper.js` - Helper for sending FCM notifications

### 2. **Configuration Updates**

#### **app.json**
```json
{
  "expo": {
    "scheme": "hommunity",
    "android": {
      "googleServicesFile": "./google-services.json",
      "useNextNotificationsApi": true,
      "permissions": ["NOTIFICATIONS"]
    },
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/images/notification-icon.png",
        "color": "#3B82F6",
        "mode": "production"
      }]
    ]
  }
}
```

#### **schema.js**
```javascript
export const users = mysqlTable('users', {
  // ... existing fields
  fcmToken: varchar('fcm_token', { length: 500 }),
  expoPushToken: varchar('expo_push_token', { length: 500 }),
});
```

#### **package.json**
- ✅ expo-notifications@~0.32.12
- ✅ expo-device@~8.0.9
- ✅ expo-linking@~8.0.8

### 3. **Integration Points**

#### **Root Layout (_layout.jsx)**
```javascript
import { NotificationProvider } from '@/contexts/NotificationContext';

export default function RootLayout() {
  return (
    <NotificationProvider>
      {/* App content */}
    </NotificationProvider>
  );
}
```

#### **User Home (app/user/home.jsx)**
```javascript
const { registerForNotifications, fcmToken, expoPushToken } = useNotification();

useEffect(() => {
  registerForNotifications().then(async (result) => {
    if (result.success) {
      // Save tokens to backend
      await savePushTokens(result.fcmToken, result.expoPushToken);
    }
  });
}, []);
```

---

## 🚀 How It Works

### **1. User Flow**

1. **App Launch** → NotificationContext initializes
2. **User Login** → User home screen registers for notifications
3. **Permission Request** → iOS/Android permission dialog
4. **Token Generation** → FCM token + Expo Push Token created
5. **Token Storage** → Saved to database via API
6. **Ready** → User can receive notifications

### **2. Guest Arrival Flow**

1. **Security Guard** uploads guest at gate
2. **API** creates guest entry in database
3. **Notification Sent** to resident's FCM token
4. **Resident Receives** notification (foreground/background/killed)
5. **User Taps** notification → Opens `security/guest-waiting` screen
6. **Deep Link** passes `guestId`, `apartmentId`, etc.

### **3. Notification Channels (Android)**

- `default` - General notifications
- `guest-arrival` - Guest arrivals (HIGH priority)
- `delivery` - Deliveries (HIGH priority)

---

## 📱 Testing Notifications

### **Option 1: Local Test (In-App)**

```javascript
import { useNotification } from '@/contexts/NotificationContext';

const { sendTestNotification } = useNotification();

// Send test notification
sendTestNotification();
```

### **Option 2: Firebase Console**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Cloud Messaging**
4. Click **Send your first message**
5. **Notification**:
   - Title: `🔔 New Guest Arrival`
   - Body: `John Doe is waiting at the gate`
6. **Target**: Single device
7. **Device Token**: Use FCM token from logs
8. **Additional Options**:
   - Channel ID: `guest-arrival`
   - Custom data:
     ```json
     {
       "type": "guest_arrival",
       "screen": "security/guest-waiting",
       "guestId": "123",
       "guestName": "John Doe"
     }
     ```
9. Click **Send**

### **Option 3: Expo Push Notifications (Recommended for Testing)**

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_EXPO_TOKEN]",
    "title": "🔔 New Guest Arrival",
    "body": "John Doe is waiting at the gate",
    "data": {
      "type": "guest_arrival",
      "screen": "security/guest-waiting",
      "guestId": "123"
    },
    "channelId": "guest-arrival",
    "priority": "high"
  }'
```

---

## 🔧 Database Migration

Add these columns to your `users` table:

```sql
ALTER TABLE users
ADD COLUMN fcm_token VARCHAR(500) NULL,
ADD COLUMN expo_push_token VARCHAR(500) NULL;
```

---

## 🐛 Debugging

### **Enable Detailed Logs**

All functions include console logs with emojis:

- 📱 = Token/Device related
- 🔔 = Notification received
- 👆 = Notification tapped
- ✅ = Success
- ❌ = Error
- 🔗 = Deep link
- 📤 = Sending notification

### **Check Token Registration**

```javascript
// In app/user/home.jsx
console.log('FCM Token:', result.fcmToken);
console.log('Expo Token:', result.expoPushToken);
```

### **Test Deep Links**

```bash
# iOS
xcrun simctl openurl booted hommunity://security/guest-waiting?guestId=123

# Android
adb shell am start -W -a android.intent.action.VIEW -d "hommunity://security/guest-waiting?guestId=123"
```

### **Common Issues**

| Issue | Solution |
|-------|----------|
| No token generated | Check if device is physical (not simulator) |
| Permissions denied | Request permissions explicitly in onboarding |
| Notifications not received | Check FCM token is saved in database |
| Deep link not working | Verify `scheme: "hommunity"` in app.json |
| Android channel error | Run `expo prebuild` after config changes |

---

## 🔐 Production Setup

### **Step 1: Enable FCM Sending**

Choose one of these options in `mobile-api/helpers/fcmHelper.js`:

#### **Option A: Firebase Admin SDK (Recommended)**

```bash
npm install firebase-admin
```

```javascript
const admin = require('firebase-admin');

// Initialize with service account
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

// Send notification
const message = {
  token: fcmToken,
  notification: { title, body },
  data: { ...data },
  android: {
    priority: 'high',
    notification: { channelId, sound: 'notification.wav' },
  },
};

await admin.messaging().send(message);
```

#### **Option B: HTTP API with Service Account**

```bash
npm install google-auth-library
```

```javascript
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth({
  scopes: 'https://www.googleapis.com/auth/firebase.messaging',
});

const client = await auth.getClient();
const accessToken = await client.getAccessToken();

// Send via HTTP
await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken.token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ message }),
});
```

#### **Option C: Expo Push Notifications (Simplest)**

Already implemented! Uses Expo's push notification service.

```javascript
await fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: expoPushToken,
    title, body, data,
    channelId: 'guest-arrival',
  }),
});
```

### **Step 2: Environment Variables**

```env
# .env.local
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### **Step 3: Service Account Setup**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings → Service Accounts
3. Generate new private key
4. **Save JSON file securely** (DO NOT commit!)
5. Set environment variables from JSON

---

## 📋 API Endpoints

### **POST /api/mobile-api/user/update-push-token**

Save FCM/Expo tokens to user profile.

**Request:**
```json
{
  "fcmToken": "string",
  "expoPushToken": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push tokens updated successfully"
}
```

### **POST /api/mobile-api/security/create-guest**

Creates guest entry and sends notification to resident.

**Request:**
```json
{
  "guestName": "John Doe",
  "apartmentId": 123,
  "photoFilename": "guest_123.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "guestId": 456,
    "notificationSent": true
  }
}
```

---

## 🎯 Deep Link Schema

Format: `hommunity://<screen>?<params>`

### **Examples:**

```
hommunity://security/guest-waiting?guestId=123&apartmentId=45
hommunity://user/home
hommunity://security/scan-qr
```

### **Notification Data Structure:**

```javascript
{
  type: 'guest_arrival',
  screen: 'security/guest-waiting',
  guestId: '123',
  apartmentId: '45',
  guestName: 'John Doe',
  timestamp: '2025-10-30T...'
}
```

---

## ✨ Features

- ✅ Foreground notifications (shows in-app)
- ✅ Background notifications (app minimized)
- ✅ Killed state notifications (app closed)
- ✅ Deep linking with custom data
- ✅ Android notification channels
- ✅ Badge count management
- ✅ Sound & vibration
- ✅ FCM + Expo Push Token support
- ✅ Automatic token refresh
- ✅ Error handling & logging
- ✅ Token storage in database

---

## 🧪 Testing Checklist

- [ ] Install app on physical device
- [ ] Grant notification permissions
- [ ] Login as user
- [ ] Check console for tokens
- [ ] Verify tokens saved in database
- [ ] Send test notification from Firebase Console
- [ ] Test foreground notification (app open)
- [ ] Test background notification (app minimized)
- [ ] Test killed state notification (app closed)
- [ ] Tap notification → Verify deep link works
- [ ] Test on both Android and iOS
- [ ] Test guest arrival notification flow end-to-end

---

## 📚 Resources

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)
- [Deep Linking Guide](https://docs.expo.dev/guides/linking/)

---

## 🎉 Ready to Use!

Your notification system is fully configured and ready for testing. The implementation supports:

- ✅ Expo SDK 54
- ✅ App Router (expo-router)
- ✅ Firebase Cloud Messaging
- ✅ Deep linking with `hommunity://` scheme
- ✅ Foreground, background, and killed state
- ✅ Full error handling

**Next Steps:**
1. Test on physical device
2. Send test notification from Firebase Console
3. Enable production FCM sending (choose an option above)
4. Deploy and monitor!

---

**Questions?** Check the console logs (they're very detailed!) or refer to this guide.
