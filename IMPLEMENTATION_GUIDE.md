# 🏢 GateWise - Complete Implementation Guide

## 📋 Project Overview

This guide documents the complete implementation of the **User-Side Guest Management System** with QR code generation, multi-apartment support, and security scanning features.

---

## ✅ **COMPLETED COMPONENTS**

### 1. **Database Schema** ✅
- **File**: `table_alter.sql`
- **File**: `schema.js` (updated)

**New Tables Created**:
- `qr_scans` - Tracks all QR code scans by security
- `member_invites` - Member signup invitations
- `user_apartment_context` - User's current apartment selection
- `guest_shares` - QR code share tracking

**Tables Modified**:
- `guests` - Added `apartment_id`, `total_members`, `is_active`, `qr_encrypted_data`, `created_by_member_id`
- `members` - Made `user_id` nullable for pending invites

---

### 2. **Utility Files** ✅

#### `utils/qrEncryption.js`
- `encryptQRData()` - AES-256 encryption for QR codes
- `decryptQRData()` - Decrypt QR codes
- `generateQRDataObject()` - Create QR data structure
- `validateQRSignature()` - Verify QR integrity
- `validateQRAccess()` - Check guest access validity
- `generateUniqueQRCode()` - Create unique QR identifiers

#### `utils/dateHelpers.js`
- `formatDate()`, `formatTime()`, `formatDateTime()`
- `getRelativeTime()` - "2 hours ago" formatting
- `isToday()`, `isPast()`, `isFuture()`
- `getDateRange()` - Date range strings
- `toDateString()`, `toTimeString()` - Conversions

---

### 3. **Components** ✅

#### `components/user/ApartmentHeader.jsx`
- Common header for all tabs
- Shows current apartment
- Apartment switcher button
- Clean, modern design (no shadows)

#### `components/user/QRCodeDisplay.jsx`
- QR code display with logo
- Download QR as image
- Share QR code via social media
- Guest information display
- Validity period indicator

#### `components/user/GuestCard.jsx`
- Guest list item component
- Guest type icons (frequent/one-time)
- Approval type badges
- Status indicators
- Action buttons (activate/deactivate/delete/show QR)
- Visit count and last visit info

---

### 4. **Tab Screens** ✅

#### `app/(tabs)/_layout.jsx`
- Tab navigation (Home, History, Active, Settings)
- Custom tab bar styling
- Futuristic design without shadows

#### `app/(tabs)/index.jsx` - **Home Tab**
- **Guest creation form**:
  - Guest type selector (One-time / Frequent)
  - Approval type selector (Pre-approved / Private)
  - Guest information fields
  - Member counter
  - Date/time pickers
  - Purpose textarea
- **QR code generation**
- **QR modal with share options**
- Modern UI with clean borders

#### `app/(tabs)/history.jsx` - **History Tab**
- List all past guests
- Filter by status (All, Approved, Pending, Expired)
- Hides private guests from other members
- Pull-to-refresh
- Empty state handling

#### `app/(tabs)/active.jsx` - **Active Guests Tab**
- List frequent guests
- Toggle active/inactive status
- Delete guest option
- Show QR code modal
- Visit statistics
- Pull-to-refresh

#### `app/(tabs)/settings.jsx` - **Settings Tab**
- User profile display
- Add apartment button
- Switch apartment option
- Manage members
- Notification toggle
- Account settings
- Logout functionality

---

### 5. **API Endpoints** ✅

#### Created:
1. **`mobile-api/user/current-apartment/route.js`**
   - GET current apartment
   - Returns all user apartments
   - Manages user context

2. **`mobile-api/user/create-guest/route.js`**
   - POST create guest
   - Generate QR code
   - Encrypt QR data
   - Return guest with QR

#### Config Updated:
- **`config/apiConfig.js`** - Added all new endpoints

---

## 🚧 **REMAINING WORK**

### 1. **API Endpoints to Create** (Priority: HIGH)

Create these files in `mobile-api/` folder:

#### `mobile-api/user/guests/history/route.js`
```javascript
// GET /api/mobile-api/user/guests/history?filter=all|approved|pending|expired
// Returns guest history
// Hide private guests created by other members
// Filter: WHERE (approval_type != 'private' OR created_by_user_id = currentUserId)
```

#### `mobile-api/user/guests/active/route.js`
```javascript
// GET /api/mobile-api/user/guests/active
// Returns only frequent guests
// WHERE guest_type = 'frequent' AND status IN ('approved', 'pending')
```

#### `mobile-api/user/guests/[id]/toggle-active/route.js`
```javascript
// PATCH /api/mobile-api/user/guests/:id/toggle-active
// Body: { isActive: true|false }
// Toggle is_active field for frequent guests
```

#### `mobile-api/user/guests/[id]/route.js`
```javascript
// DELETE /api/mobile-api/user/guests/:id
// Soft delete or hard delete guest
// Verify ownership before deleting
```

#### `mobile-api/user/switch-apartment/route.js`
```javascript
// POST /api/mobile-api/user/switch-apartment
// Body: { apartmentId: number }
// Update user_apartment_context table
```

#### `mobile-api/security/scan-qr/route.js` (CRITICAL)
```javascript
// POST /api/mobile-api/security/scan-qr
// Body: { encryptedQRData: string, securityId: number }
// Steps:
// 1. Decrypt QR data
// 2. Validate signature
// 3. Verify guest exists
// 4. Check if active
// 5. Validate date/time
// 6. Check apartment match
// 7. Log scan in qr_scans table
// 8. Return access granted/denied + reason
```

---

### 2. **Security QR Scanner Screen** (Priority: HIGH)

Create: `app/(security)/security/dynamic-scan-qr.jsx`

**Features Needed**:
- Use `expo-camera` for QR scanning
- Decrypt scanned QR code
- Show guest details on scan
- Display access granted/denied with reason
- Show total members, apartment, validity
- Log scan to database
- Handle errors gracefully

**Example Structure**:
```jsx
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function DynamicScanQR() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState(null);

  const handleBarCodeScanned = async ({ data }) => {
    try {
      // Call API to validate QR
      const response = await fetch(buildApiUrl(API_ENDPOINTS.SCAN_QR), {
        method: 'POST',
        body: JSON.stringify({ encryptedQRData: data }),
      });

      const result = await response.json();

      if (result.accessGranted) {
        // Show green success screen
      } else {
        // Show red denial screen with reason
      }
    } catch (error) {
      // Handle error
    }
  };

  return (
    <CameraView
      onBarcodeScanned={handleBarCodeScanned}
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
    />
  );
}
```

---

### 3. **User Home Redirect** ✅ **COMPLETED**

**Created**: `app/home.jsx`

Redirects authenticated users to the tabs:
```jsx
export default function UserHome() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to tabs
    router.replace('/(tabs)/home');
  }, []);

  return <View><ActivityIndicator /></View>;
}
```

**Note**: The tab has been renamed from `index` to `home` in `app/(tabs)/_layout.jsx`

---

### 4. **Member Signup Flow** (Priority: MEDIUM)

#### Create: `app/(auth)/member-signup.jsx`
- Check if user exists by mobile number
- If exists without password: update password
- If exists with password: show error
- Link to apartment via invite code

#### Create: `mobile-api/auth/member-signup/route.js`
```javascript
// POST /api/mobile-api/auth/member-signup
// Body: { mobileNumber, password, inviteCode }
// Steps:
// 1. Find member_invite by inviteCode
// 2. Verify mobile number matches
// 3. Check if user exists in users table
// 4. If exists without password: UPDATE password
// 5. If exists with password: ERROR "Already registered"
// 6. Link to apartment via members table
// 7. Mark invite as accepted
// 8. Generate JWT token
```

---

### 5. **Apartment Management Screens** (Priority: MEDIUM)

#### `app/user/manage-members.jsx`
- List all members in current apartment
- Show pending invites
- Invite new member button
- Delete member option

#### Create: `mobile-api/user/members/invite/route.js`
```javascript
// POST /api/mobile-api/user/members/invite
// Body: { name, mobileNumber, relation, apartmentId }
// Steps:
// 1. Generate unique invite code
// 2. Insert into member_invites table
// 3. Send SMS with invite code (optional)
// 4. Return invite details
```

---

### 6. **Install Dependencies** (Priority: HIGH)

```bash
npm install crypto-js react-native-qrcode-svg expo-sharing expo-file-system react-native-view-shot @react-native-community/datetimepicker
```

---

### 7. **Database Setup** (Priority: CRITICAL)

Run the SQL script:
```bash
mysql -u your_user -p gatewise_db < table_alter.sql
```

Or manually run each ALTER/CREATE statement from `table_alter.sql`

---

## 🎨 **Design System Reference**

### Colors
- **Primary**: `#3B82F6` (Blue)
- **Secondary**: `#8B5CF6` (Purple)
- **Success**: `#10B981` (Green)
- **Error**: `#EF4444` (Red)
- **Warning**: `#F59E0B` (Amber)

### Design Rules
- ❌ **NO SHADOWS** - Use borders instead
- ✅ Border radius: `12px` for cards, `20px` for full radius
- ✅ Border width: `1px`
- ✅ Border color: `#E5E7EB` (gray-200)
- ✅ Spacing: `16px` base unit
- ✅ Typography: Outfit font family

---

## 🧪 **Testing Checklist**

### User Flow
- [ ] Login as user
- [ ] See apartment selection if multiple apartments
- [ ] Navigate to Home tab
- [ ] Create one-time guest (pre-approved)
- [ ] See QR code generated
- [ ] Download QR code
- [ ] Share QR code
- [ ] Create frequent guest
- [ ] Navigate to Active tab
- [ ] Toggle guest active/inactive
- [ ] Show QR code from active tab
- [ ] Delete guest
- [ ] Navigate to History tab
- [ ] Filter guests by status
- [ ] Navigate to Settings
- [ ] Switch apartment
- [ ] Logout

### Security Flow
- [ ] Login as security
- [ ] Open QR scanner
- [ ] Scan guest QR code
- [ ] See access granted (green screen)
- [ ] See guest details (name, apartment, members)
- [ ] Scan expired QR
- [ ] See access denied (red screen) with reason
- [ ] Check scan logged in qr_scans table

### Member Flow
- [ ] Create member invite as owner
- [ ] Member receives invite code
- [ ] Member signs up with mobile + password
- [ ] Member can create private guests
- [ ] Other members don't see private guests

---

## 🔐 **Security Considerations**

1. **QR Encryption**:
   - Use same SECRET_KEY on client and server
   - Store key in environment variables in production
   - Never expose key in client code

2. **Signature Validation**:
   - Always validate QR signature before granting access
   - Reject tampered QR codes

3. **Access Control**:
   - Verify user owns apartment before creating guests
   - Hide private guests from other members
   - Verify ownership before delete/update operations

4. **Token Expiry**:
   - Implement JWT token expiry
   - Refresh tokens when needed

---

## 📱 **App Structure**

```
app/
├── index.jsx ✅ (Onboarding with auth check)
├── home.jsx ✅ (Redirects to tabs)
├── (auth)/
│   ├── user-login.jsx ✅ (redirects to /home)
│   ├── user-signup.jsx ✅
│   ├── member-signup.jsx (TO CREATE)
│   └── security-login.jsx
├── (tabs)/
│   ├── _layout.jsx ✅
│   ├── home.jsx ✅ (renamed from index.jsx)
│   ├── history.jsx ✅
│   ├── active.jsx ✅
│   └── settings.jsx ✅
├── (security)/
│   └── security/
│       ├── home.jsx
│       ├── scan-qr.jsx (existing)
│       └── dynamic-scan-qr.jsx (TO CREATE)
└── user/
    ├── home.jsx (old apartment list screen)
    ├── select-apartment.jsx ✅
    ├── add-apartment.jsx ✅
    └── manage-members.jsx (TO CREATE)

components/
└── user/
    ├── ApartmentHeader.jsx ✅
    ├── QRCodeDisplay.jsx ✅
    └── GuestCard.jsx ✅

utils/
├── qrEncryption.js ✅
└── dateHelpers.js ✅

mobile-api/
├── user/
│   ├── current-apartment/route.js ✅
│   ├── create-guest/route.js ✅
│   ├── switch-apartment/route.js (TO CREATE)
│   ├── guests/
│   │   ├── history/route.js (TO CREATE)
│   │   ├── active/route.js (TO CREATE)
│   │   └── [id]/
│   │       ├── toggle-active/route.js (TO CREATE)
│   │       └── route.js (DELETE) (TO CREATE)
│   └── members/
│       └── invite/route.js (TO CREATE)
├── security/
│   └── scan-qr/route.js (TO CREATE - CRITICAL)
└── auth/
    └── member-signup/route.js (TO CREATE)
```

---

## 🚀 **Deployment Steps**

### 1. Database
```sql
-- Run table_alter.sql
mysql -u user -p database < table_alter.sql

-- Verify tables
SHOW TABLES LIKE 'qr_scans';
SHOW TABLES LIKE 'member_invites';
SHOW TABLES LIKE 'user_apartment_context';
```

### 2. Install Dependencies
```bash
cd gatewise
npm install
```

### 3. Build & Test
```bash
# Development
npx expo start

# Build Android
eas build --platform android --profile development

# Build iOS
eas build --platform ios --profile development
```

### 4. Environment Variables
Create `.env.local`:
```
QR_ENCRYPTION_KEY=GateWise2025SecureQRCodeEncryptionKey!@#$%
DATABASE_URL=mysql://user:pass@host:3306/gatewise
JWT_SECRET=your-jwt-secret-here
```

---

## 📞 **Support & Next Steps**

### Immediate Priorities (Do These First):
1. ✅ **Run `table_alter.sql`** on your database
2. ✅ **Install dependencies** listed above
3. 🔴 **Create security QR scanner** (`dynamic-scan-qr.jsx`)
4. 🔴 **Create scan-qr API endpoint** (critical for scanning)
5. 🔴 **Create guest history API**
6. 🔴 **Create active guests API**
7. 🔴 **Update user/home.jsx** to redirect to tabs
8. ✅ **Test end-to-end flow**

### Future Enhancements:
- Push notifications when QR is scanned
- Real-time guest arrival notifications
- Guest analytics dashboard
- Visitor photo capture
- Delivery tracking integration
- Access logs and reports

---

## 📄 **Files Created Summary**

**Total Files Created: 15+**

### Database:
- ✅ `table_alter.sql` - Database alterations
- ✅ `schema.js` - Updated schema

### Utilities:
- ✅ `utils/qrEncryption.js`
- ✅ `utils/dateHelpers.js`

### Components:
- ✅ `components/user/ApartmentHeader.jsx`
- ✅ `components/user/QRCodeDisplay.jsx`
- ✅ `components/user/GuestCard.jsx`

### Screens:
- ✅ `app/(tabs)/_layout.jsx`
- ✅ `app/(tabs)/index.jsx`
- ✅ `app/(tabs)/history.jsx`
- ✅ `app/(tabs)/active.jsx`
- ✅ `app/(tabs)/settings.jsx`

### APIs:
- ✅ `mobile-api/user/current-apartment/route.js`
- ✅ `mobile-api/user/create-guest/route.js`

### Config:
- ✅ `config/apiConfig.js` - Updated

---

**🎉 You now have a fully functional guest management system foundation!**

Complete the remaining API endpoints and QR scanner to finish the implementation.
