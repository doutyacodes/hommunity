# GateWise Mobile App - Complete Setup & Usage Guide

## 🎉 What Has Been Completed

### ✅ 1. Members Management System
**Files Created:**
- `mobile-api/user/members/route.js` - Complete CRUD API
- `app/user/members.jsx` - Modern, futuristic UI

**Features:**
- Add, edit, delete members
- Member verification status tracking
- Real-time statistics (Total, Verified, Pending)
- Form validation
- Pull-to-refresh
- Beautiful gradient UI matching your theme

---

### ✅ 2. Enhanced Guest Approval Page
**File Updated:** `app/user/guest-approval.jsx`

**New Features:**
- ⏱️ **5-second polling** - Automatically detects if someone else approved
- 🔄 **Auto-redirect** - Redirects after 3 seconds if already processed
- 🔒 **Private guest badge** - Shows when guest created by member
- 💫 **Pulse animation** - Pending approval pulses to grab attention
- 👤 **Processing detection** - Shows who approved/denied
- 🎨 **Modern gradient UI** - Completely redesigned with gradients

---

### ✅ 3. QR Scanner with Camera Integration
**File Created:** `app/(security)/security/scan-qr-improved.jsx`

**Features:**
- 📷 **Real camera integration** using expo-camera (v17.0.8)
- 🔦 **Torch/flash toggle** for dark environments
- ✅ **Success/error overlays** with guest info display
- 📳 **Vibration feedback** on scan (different patterns for success/error)
- 🔐 **API verification** - Calls your existing `/api/mobile-api/security/scan-qr`
- 🔄 **Auto-retry** after 3 seconds on error
- 🎨 **Futuristic design** with animated scan line

---

### ✅ 4. API Configuration Update
**File Updated:** `config/apiConfig.js`

**Added Endpoints:**
```javascript
MEMBERS_LIST: '/api/mobile-api/user/members',
ADD_MEMBER: '/api/mobile-api/user/members',
UPDATE_MEMBER: '/api/mobile-api/user/members',
DELETE_MEMBER: '/api/mobile-api/user/members',
```

---

## 🚀 How to Integrate

### Step 1: Replace scan-qr.jsx
```bash
# Backup existing file
mv app/(security)/security/scan-qr.jsx app/(security)/security/scan-qr.jsx.backup

# Use the new improved version
mv app/(security)/security/scan-qr-improved.jsx app/(security)/security/scan-qr.jsx
```

### Step 2: Add Members Navigation
Add a menu item or button to navigate to the members page:

```javascript
// In your home screen or menu
<TouchableOpacity onPress={() => router.push('/user/members')}>
  <Text>Members</Text>
</TouchableOpacity>
```

### Step 3: Test Camera Permissions
The camera will automatically request permissions on first use. Make sure to:
- Test on a real device (camera doesn't work in simulator)
- Grant camera permissions when prompted
- Test torch/flash toggle
- Scan valid QR codes from your system

### Step 4: Verify API Integration
The scanner calls your existing API:
```
POST /api/mobile-api/security/scan-qr
Body: { encryptedQRData: "scanned_qr_data" }
```

Make sure this endpoint returns:
```json
{
  "success": true,
  "accessGranted": true/false,
  "reason": "Access granted/denied",
  "message": "Guest access approved",
  "guestInfo": {
    "guestName": "John Doe",
    "apartmentNumber": "101",
    "towerName": "A",
    ...
  }
}
```

---

## 📱 Usage Instructions

### For Members Management

**To Access:**
Navigate to `/user/members` with apartment context:
```javascript
router.push({
  pathname: '/user/members',
  params: {
    apartmentId: currentApartmentId,
    apartmentNumber: '101',
    towerName: 'A'
  }
});
```

**Features:**
1. **View Members:** See all members with verification status
2. **Add Member:** Click the + button, fill form, submit
3. **Edit Member:** Tap on any member card
4. **Delete Member:** Tap trash icon, confirm deletion
5. **Refresh:** Pull down to refresh list

**Form Fields:**
- Name (required, min 2 characters)
- Mobile Number (optional, 10 digits if provided)
- Relation (required, quick-select buttons)

---

### For Guest Approval

**Features in Action:**

1. **Receive Notification**
   - Guest arrives at gate
   - Security creates entry
   - You receive push notification

2. **Open Approval Screen**
   - Tap notification
   - Screen shows guest details
   - Banner pulses if pending

3. **Automatic Polling**
   - Every 5 seconds, checks if someone else approved
   - If already processed, shows "Already Approved by [Name]"
   - Auto-redirects after 3 seconds

4. **Private Guest Badge**
   - If guest created by a member (not you)
   - Shows purple badge: "Private Guest (Member)"

5. **Approve or Deny**
   - Tap large gradient buttons
   - Confirmation dialog
   - Process and redirect

**What Happens When:**
- ✅ **Approved:** Green banner, success message, redirect
- ❌ **Denied:** Red banner, denied message, redirect
- ⏱️ **Already Processed:** Shows who processed, auto-redirect in 3s
- 🔄 **Network Error:** Continue polling, show error

---

### For QR Scanning (Security)

**Step-by-Step:**

1. **Open Scanner**
   - Navigate to scan QR screen
   - Camera permissions requested (first time)

2. **Grant Permission**
   - Tap "Grant Permission" button
   - Accept camera access in system dialog

3. **Scan QR Code**
   - Point camera at guest's QR code
   - Keep QR within blue corner frame
   - Phone vibrates on scan

4. **View Result**
   - **Success:** Green checkmark, guest info, "Access Granted!"
   - **Error:** Red X, reason, error message

5. **Actions After Scan**
   - Success: Auto-redirects after 3 seconds
   - Error: Auto-enables retry after 3 seconds
   - Or tap "Scan Again" button manually
   - Or tap "Enter Details Manually" for manual entry

**Torch/Flash:**
- Tap flashlight icon in header
- Toggles on/off
- Gold color when active

**Manual Entry:**
- Bottom button: "Enter Details Manually"
- Routes to `/security/upload-guest`
- For non-QR guests

---

## 🎨 Design Highlights

### Color Scheme
All screens use your existing theme:
- **Primary:** Blue (#3B82F6) & Purple (#8B5CF6)
- **Success:** Green (#10B981)
- **Error:** Red (#EF4444)
- **Warning:** Amber (#F59E0B)

### UI Features
- ✨ **LinearGradient** backgrounds
- 🌟 **Glassmorphic** effects
- 💫 **Smooth animations** (react-native-reanimated)
- 🎯 **Large touch targets** (44x44 minimum)
- 📊 **Visual hierarchy** with spacing
- 🔲 **Rounded corners** (borderRadius.xl = 16px)
- 🌑 **Elevated shadows** for depth

### Typography
- **Font:** Outfit (Thin through Black weights)
- **Sizes:** xxs (10px) through giant (48px)
- **Hierarchy:** Clear distinction between headers, body, captions

---

## 🔧 Troubleshooting

### Camera Not Working
**Problem:** Camera doesn't show or is black
**Solution:**
1. Check permissions in Settings > App > GateWise > Camera
2. Restart app after granting permission
3. Test on real device (not simulator)

### QR Not Scanning
**Problem:** QR code not detected
**Solution:**
1. Ensure QR code is well-lit (use torch)
2. Keep QR within blue corner frame
3. Hold steady for 1-2 seconds
4. Ensure QR is not too small/large
5. Check QR code is valid format

### Polling Not Working
**Problem:** Doesn't detect when someone else approved
**Solution:**
1. Check internet connection
2. Verify API endpoint is accessible
3. Check console logs for errors
4. Ensure guestId parameter is correct

### Members Not Loading
**Problem:** Members list empty or not loading
**Solution:**
1. Check apartmentId parameter
2. Verify user owns this apartment
3. Pull to refresh
4. Check API response in network tab

---

## 📊 API Response Examples

### Scan QR - Success
```json
{
  "success": true,
  "accessGranted": true,
  "reason": "Access granted",
  "message": "Guest access approved",
  "guestInfo": {
    "id": 123,
    "guestName": "John Doe",
    "guestPhone": "9876543210",
    "totalMembers": 2,
    "vehicleNumber": "KA01AB1234",
    "purpose": "Visit",
    "apartmentNumber": "101",
    "towerName": "A",
    "floorNumber": 1,
    "communityName": "Green Valley",
    "createdByName": "Jane Doe",
    "guestType": "one_time",
    "approvalType": "preapproved",
    "startDate": "2025-01-15",
    "endDate": "2025-01-15"
  }
}
```

### Scan QR - Denied
```json
{
  "success": true,
  "accessGranted": false,
  "reason": "Access period expired",
  "message": "Access expired on 01/14/2025",
  "guestInfo": {
    "guestName": "John Doe",
    "apartmentNumber": "101",
    "towerName": "A",
    "endDate": "2025-01-14"
  }
}
```

### Members List
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "mobileNumber": "9876543210",
      "relation": "Father",
      "isVerified": true,
      "createdAt": "2025-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "name": "Jane Doe",
      "mobileNumber": "9876543211",
      "relation": "Mother",
      "isVerified": false,
      "createdAt": "2025-01-15T11:00:00Z"
    }
  ],
  "count": 2
}
```

---

## 🔐 Security Notes

### JWT Authentication
All APIs use JWT tokens:
```javascript
// Frontend sends
headers: {
  'Authorization': 'Bearer <jwt_token>'
}

// Backend verifies with jose
import { jwtVerify } from 'jose';
const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
```

### QR Code Encryption
- **Algorithm:** AES-256-CBC
- **Signature:** HMAC-SHA256
- **Decryption:** Server-side only
- **Validation:** Signature + expiry checks

### Permissions
All operations verify:
- ✅ User authentication (valid JWT)
- ✅ User type (user/security)
- ✅ Apartment ownership
- ✅ Admin approval status

---

## 📝 Database Schema Reference

### Members Table
```sql
CREATE TABLE members (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT NOT NULL,
  communityId BIGINT NOT NULL,
  apartmentId BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  mobileNumber VARCHAR(15),
  relation VARCHAR(100),
  isVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### Guests Table (Relevant Fields)
```sql
CREATE TABLE guests (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  createdByUserId BIGINT NOT NULL,
  createdByMemberId BIGINT, -- If created by member (private)
  guestName VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'denied', 'expired'),
  ...
);
```

---

## 🎯 Next Steps (Optional Enhancements)

### 1. Delivery Approval Enhancement
Similar to guest approval, add to `delivery-approval.jsx`:
- 5-second polling
- Already processed detection
- Modern gradient UI
- Auto-redirect

### 2. Time Expiry Notifications
Create a background task:
```javascript
// Check expired guests every hour
setInterval(async () => {
  const expiredGuests = await getExpiredGuests();
  for (const guest of expiredGuests) {
    await sendPushNotification(guest.userId, {
      title: "Guest Pass Expired",
      body: `QR code for ${guest.guestName} has expired`,
      data: { type: "guest_expired", guestId: guest.id }
    });
    await updateGuestStatus(guest.id, 'expired');
  }
}, 3600000); // 1 hour
```

### 3. Member Verification Flow
Add admin approval for members:
- Member requests to join
- Admin receives notification
- Admin approves/denies
- Member gets verified badge

### 4. Analytics Dashboard
Track:
- Total scans per day
- Most frequent visitors
- Peak entry times
- Approval rates
- Member growth

---

## 📞 Support & Resources

### Documentation
- **Expo Camera:** https://docs.expo.dev/versions/latest/sdk/camera/
- **JWT (jose):** https://github.com/panva/jose
- **React Native Reanimated:** https://docs.swmansion.com/react-native-reanimated/

### File Locations
```
mobile-api/
  └── user/
      └── members/route.js         ← Members CRUD API

app/
  ├── user/
  │   ├── members.jsx              ← Members UI (NEW)
  │   ├── guest-approval.jsx       ← Improved Guest Approval
  │   └── delivery-approval.jsx    ← To be improved
  └── (security)/security/
      └── scan-qr.jsx              ← Replace with scan-qr-improved.jsx

config/
  └── apiConfig.js                 ← Updated with members endpoints

theme.js                           ← Design system
schema.js                          ← Database schema
```

### Testing Checklist
- [ ] Members: Add, edit, delete
- [ ] Members: Form validation
- [ ] Members: Pull to refresh
- [ ] Guest Approval: Receive notification
- [ ] Guest Approval: 5-second polling
- [ ] Guest Approval: Approve action
- [ ] Guest Approval: Deny action
- [ ] Guest Approval: Already processed detection
- [ ] Guest Approval: Private badge shows
- [ ] QR Scanner: Camera permission
- [ ] QR Scanner: Successful scan
- [ ] QR Scanner: Invalid QR error
- [ ] QR Scanner: Torch toggle
- [ ] QR Scanner: Guest info display
- [ ] QR Scanner: Auto-retry on error

---

## 🎨 Screenshots Description

### Members Page
- Header: Back button, "Members" title, + button
- Stats Bar: Total (blue), Verified (green), Pending (amber)
- Member Cards: Avatar gradient, name, relation, phone, date
- Actions: Edit (blue), Delete (red)
- Empty State: Purple gradient icon, "Add First Member" button

### Guest Approval
- Pulse Banner: Blue gradient, notification icon, title
- Private Badge: Purple pill badge if member-created
- Photo: Large image with dark gradient overlay
- Details: Color-coded icons, clean typography
- Actions: Red "Deny", Green "Approve" gradient buttons
- Processed: Green/Red banner with who approved/denied

### QR Scanner
- Camera: Full-screen camera view
- Frame: Blue corner borders, animated scan line
- Success: Green overlay, checkmark, guest info
- Error: Red overlay, X icon, error reason
- Controls: Back, torch, manual entry buttons

---

## 💡 Pro Tips

1. **Testing QR Codes**
   - Generate test QR codes from your system
   - Test with expired dates
   - Test with denied status
   - Test with invalid signatures

2. **Performance**
   - Polling stops automatically when screen unmounts
   - Camera releases when not in use
   - Images load progressively
   - Lists use FlatList for virtualization

3. **User Experience**
   - Vibration feedback on important actions
   - Loading states everywhere
   - Error messages are user-friendly
   - Auto-redirects prevent confusion

4. **Maintenance**
   - Follow theme system for new features
   - Use LinearGradient for visual interest
   - Add proper error handling
   - Test on both iOS and Android

---

**🎉 Congratulations!** Your GateWise app now has:
- ✅ Complete Members Management
- ✅ Enhanced Guest Approval with Polling
- ✅ Working QR Scanner with Camera
- ✅ Modern, Futuristic UI Throughout
- ✅ Proper JWT Authentication
- ✅ Real-time Status Updates

**Need Help?** Check the IMPLEMENTATION_SUMMARY.md for technical details.

---

*Last Updated: January 2025*
*Version: 1.0.0*
