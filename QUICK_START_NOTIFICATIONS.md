# 🚀 Quick Start - Push Notifications

## 1️⃣ Prerequisites

✅ Already done:
- expo-notifications installed
- expo-device installed
- expo-linking installed
- google-services.json in root
- app.json configured

## 2️⃣ Database Setup

Run this SQL migration:

```sql
ALTER TABLE users
ADD COLUMN fcm_token VARCHAR(500) NULL,
ADD COLUMN expo_push_token VARCHAR(500) NULL;
```

## 3️⃣ Test on Physical Device

```bash
# Start Expo
npm start

# Scan QR code with phone
# OR
npm run android  # For Android
npm run ios      # For iOS
```

## 4️⃣ Get Test Tokens

1. Login as a user in the app
2. Check console logs for:
   ```
   ✅ Notifications registered successfully
   FCM Token: fFZ...
   Expo Token: ExponentPushToken[...]
   ```
3. Copy these tokens

## 5️⃣ Send Test Notification

### Option A: Expo Push (Easiest)

```bash
curl -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "ExponentPushToken[YOUR_TOKEN_HERE]",
    "title": "Test from Hommunity",
    "body": "Your notification system works!",
    "data": {
      "type": "test",
      "screen": "user/home"
    }
  }'
```

### Option B: Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project
3. Cloud Messaging → Send your first message
4. Fill in:
   - Title: `Test Notification`
   - Body: `This is a test`
   - Target: Single device
   - Token: Your FCM token
5. Send!

## 6️⃣ Test Guest Notification Flow

1. **Login as User** (to register tokens)
2. **Login as Security** (different device/session)
3. **Security** → Upload Guest → Select apartment
4. **User receives notification** 🎉
5. **Tap notification** → Opens guest-waiting screen

## 7️⃣ Enable Production FCM

Choose one option in `mobile-api/helpers/fcmHelper.js`:

### Option 1: Expo Push (No setup needed!)
Already works! Uses tokens automatically.

### Option 2: Firebase Admin SDK
```bash
npm install firebase-admin
```

Uncomment Firebase Admin code in `fcmHelper.js` (line 56-88)

### Option 3: HTTP API
```bash
npm install google-auth-library
```

Uncomment HTTP API code in `fcmHelper.js` (line 90-130)

## 🧪 Testing Checklist

- [ ] App runs on physical device
- [ ] Permissions granted
- [ ] Tokens logged in console
- [ ] Tokens saved in database
- [ ] Test notification received (foreground)
- [ ] Test notification received (background)
- [ ] Test notification received (killed)
- [ ] Deep link works when tapped

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| No token | Use physical device (not simulator) |
| Permission denied | Check app settings → Notifications |
| Not received | Verify token in database |
| Deep link broken | Check scheme is `hommunity` in app.json |

## 📱 Deep Link Testing

```bash
# Test deep link directly
# Android:
adb shell am start -W -a android.intent.action.VIEW \
  -d "hommunity://security/guest-waiting?guestId=123"

# iOS:
xcrun simctl openurl booted "hommunity://security/guest-waiting?guestId=123"
```

## 🎯 Common Commands

```bash
# Rebuild after config changes
npx expo prebuild

# Clear cache
npx expo start --clear

# View logs
npx expo start --android --dev-client
# Then open Metro logs
```

## ✅ You're Done!

Your notification system is ready. Test it end-to-end with the guest arrival flow.

**Need help?** See `NOTIFICATIONS_SETUP.md` for detailed documentation.
