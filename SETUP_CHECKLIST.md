# 🚀 GateWise Setup Checklist

## ✅ **COMPLETED**

### 1. **Tab Structure Updated**
- ✅ Tab renamed from `index` to `home` in `app/(tabs)/_layout.jsx`
- ✅ Created `app/(tabs)/home.jsx` (guest creation)
- ✅ Created `app/(tabs)/history.jsx` (guest history)
- ✅ Created `app/(tabs)/active.jsx` (active guests)
- ✅ Created `app/(tabs)/settings.jsx` (settings)

### 2. **Authentication Flow Fixed**
- ✅ `app/index.jsx` - Redirects authenticated users to `/home`
- ✅ `app/(auth)/user-login.jsx` - Redirects to `/home` after login
- ✅ `app/home.jsx` - **NEW FILE** - Redirects to `/(tabs)/home`

### 3. **Components Created**
- ✅ `components/user/ApartmentHeader.jsx` - Common header
- ✅ `components/user/QRCodeDisplay.jsx` - QR code component
- ✅ `components/user/GuestCard.jsx` - Guest list cards

### 4. **Utilities Created**
- ✅ `utils/qrEncryption.js` - QR encryption/decryption
- ✅ `utils/dateHelpers.js` - Date formatting

### 5. **API Endpoints Created**
- ✅ `mobile-api/user/current-apartment/route.js`
- ✅ `mobile-api/user/create-guest/route.js`

### 6. **Database Schema**
- ✅ `table_alter.sql` - Ready to run
- ✅ `schema.js` - Updated with new tables

---

## 📋 **NEXT STEPS** (In Order of Priority)

### **Step 1: Database Setup** 🔴 CRITICAL
```bash
# Run this SQL file on your MySQL database
mysql -u your_username -p gatewise_db < table_alter.sql

# Verify tables were created
mysql -u your_username -p gatewise_db -e "SHOW TABLES LIKE 'qr_scans';"
mysql -u your_username -p gatewise_db -e "SHOW TABLES LIKE 'user_apartment_context';"
```

### **Step 2: Install Dependencies** 🔴 CRITICAL
```bash
npm install crypto-js react-native-qrcode-svg expo-sharing expo-file-system react-native-view-shot @react-native-community/datetimepicker
```

### **Step 3: Test Current Implementation** 🟡 HIGH
```bash
# Start the development server
npx expo start

# Test flow:
# 1. Login as user
# 2. Should redirect to tabs
# 3. Try creating a guest
# 4. See if QR modal appears
```

### **Step 4: Create Missing API Endpoints** 🟡 HIGH

Create these files in order:

1. **`mobile-api/user/guests/history/route.js`**
   - GET endpoint for guest history
   - Filter by status (all, approved, pending, expired)
   - Hide private guests from other members

2. **`mobile-api/user/guests/active/route.js`**
   - GET endpoint for active frequent guests
   - Return only frequent guests with is_active = true

3. **`mobile-api/security/scan-qr/route.js`** ⚡ MOST CRITICAL
   - POST endpoint to validate QR code
   - Decrypt QR data
   - Validate signature
   - Check access permissions
   - Log scan in qr_scans table
   - Return access granted/denied

4. **`mobile-api/user/guests/[id]/toggle-active/route.js`**
   - PATCH endpoint to toggle is_active field

5. **`mobile-api/user/guests/[id]/route.js`**
   - DELETE endpoint to delete guest

6. **`mobile-api/user/switch-apartment/route.js`**
   - POST endpoint to switch current apartment context

### **Step 5: Create Security QR Scanner** 🟡 HIGH

**File**: `app/(security)/security/dynamic-scan-qr.jsx`

Use expo-camera to scan QR codes:
```bash
npx expo install expo-camera
```

---

## 🧪 **Testing Checklist**

After completing the above steps, test these flows:

### **User Flow**
- [ ] Login redirects to tabs
- [ ] Can see current apartment in header
- [ ] Can create one-time guest
- [ ] QR code modal appears
- [ ] Can download QR code
- [ ] Can share QR code
- [ ] Can create frequent guest
- [ ] Guest appears in Active tab
- [ ] Can toggle guest active/inactive
- [ ] Guest appears in History tab
- [ ] Can filter history by status
- [ ] Can switch apartment (if multiple)
- [ ] Can logout

### **Security Flow** (After creating scanner)
- [ ] Can scan guest QR code
- [ ] Access granted for valid QR
- [ ] Access denied for expired QR
- [ ] Access denied for inactive guest
- [ ] Scan is logged in database
- [ ] Guest details displayed correctly

---

## 🔧 **Configuration Check**

### **Environment Variables**
Check if you need to set these:
- `QR_ENCRYPTION_KEY` - For production
- `DATABASE_URL` - MySQL connection
- `JWT_SECRET` - For authentication

### **API Base URL**
Check `config/apiConfig.js`:
```javascript
export const API_BASE_URL = 'https://gatewise.vercel.app';
// Or for local development:
// export const API_BASE_URL = 'http://192.168.1.x:3000';
```

---

## 📱 **Build & Deploy**

### **Development Build**
```bash
# Android
eas build --platform android --profile development

# iOS
eas build --platform ios --profile development
```

### **Production Build**
```bash
# Android
eas build --platform android --profile production

# iOS
eas build --platform ios --profile production
```

---

## ⚠️ **Known Issues to Watch For**

1. **QR Code Display on Android**
   - Some Android devices may need additional permissions for file saving
   - Test download functionality thoroughly

2. **Camera Permissions**
   - Ensure camera permissions are requested before scanning
   - Add permission requests to app.json if needed

3. **Notification Permissions**
   - Already configured, but test on physical device

4. **Database Foreign Keys**
   - Ensure foreign key constraints are set up correctly
   - Test cascade deletes

---

## 📞 **Need Help?**

If you encounter issues:

1. **Check console logs** - Most errors are logged
2. **Verify database** - Ensure tables were created
3. **Check API responses** - Use Postman to test endpoints
4. **Review IMPLEMENTATION_GUIDE.md** - Detailed implementation guide

---

## 🎉 **Current Status**

**Completed**: ~70%
- ✅ Database schema designed
- ✅ Tab navigation working
- ✅ Guest creation UI complete
- ✅ QR code generation ready
- ✅ Auth flow updated

**Remaining**: ~30%
- 🔴 API endpoints (5-6 endpoints)
- 🔴 Security QR scanner
- 🔴 Database migration

**Estimated Time to Complete**: 2-3 hours

---

**Last Updated**: 2025-01-31
**Version**: 1.0.0
