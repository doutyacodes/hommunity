// ============================================
// FILE: config/apiConfig.js
// Mobile App API Configuration - UPDATED with Apartment Requests
// ============================================

// API Base URL
// export const API_BASE_URL = 'https://gatewise.vercel.app';
export const API_BASE_URL = 'http://192.168.1.13:3000';

// API Endpoints
export const API_ENDPOINTS = {
  // ============================================
  // Authentication Endpoints
  // ============================================
  SECURITY_LOGIN: '/api/mobile-api/auth/security-login',
  USER_LOGIN: '/api/mobile-api/auth/user-login',
  USER_SIGNUP: '/api/mobile-api/auth/user-signup',
  LOGOUT: '/api/mobile-api/auth/logout',
  
  // ============================================
  // Security Operations
  // ============================================
  GET_APARTMENTS: '/api/mobile-api/security/apartments',
  VERIFY_QR: '/api/mobile-api/security/verify-qr',
  CREATE_GUEST_ENTRY: '/api/mobile-api/security/create-guest',
  CREATE_DELIVERY_ENTRY: '/api/mobile-api/security/create-delivery',
  GET_DELIVERY_LOGS: '/api/mobile-api/security/create-delivery',
  GET_VISITOR_LOGS: '/api/mobile-api/security/visitor-logs',
  UPDATE_ENTRY_EXIT: '/api/mobile-api/security/update-entry',
  
  // ============================================
  // User/Resident Operations
  // ============================================
  CREATE_GUEST: '/api/mobile-api/user/create-guest',
  GET_MY_GUESTS: '/api/mobile-api/user/my-guests',
  GET_QR_CODE: '/api/mobile-api/user/get-qr',
  GET_MY_APARTMENTS: '/api/mobile-api/user/my-apartments',
  GET_MY_MEMBERS: '/api/mobile-api/user/my-members',
  UPDATE_PUSH_TOKEN: '/api/mobile-api/user/update-push-token',
  APPROVE_GUEST: '/api/mobile-api/user/approve-guest',
  APPROVE_DELIVERY: '/api/mobile-api/user/approve-delivery',
  GET_GUEST_DETAILS: '/api/mobile-api/user/approve-guest',
  GET_DELIVERY_DETAILS: '/api/mobile-api/user/approve-delivery',
  
  // ============================================
  // Apartment Request Operations (NEW)
  // ============================================
  USER_COMMUNITIES: '/api/mobile-api/user/communities',
  COMMUNITY_APARTMENTS: (communityId) => `/api/mobile-api/user/communities/${communityId}/apartments`,
  COMMUNITY_RULES: (communityId) => `/api/mobile-api/user/communities/${communityId}/rules`,
  CREATE_APARTMENT_REQUEST: '/api/mobile-api/user/apartment-requests',
  
  // ============================================
  // Admin Operations (NEW)
  // ============================================
  ADMIN_APARTMENT_REQUESTS: '/api/mobile-api/admin/apartment-requests',
  ADMIN_REVIEW_REQUEST: (requestId) => `/api/mobile-api/admin/apartment-requests/${requestId}`,

  // ============================================
  // Guest Management (NEW)
  // ============================================
  GET_CURRENT_APARTMENT: '/api/mobile-api/user/current-apartment',
  SWITCH_APARTMENT: '/api/mobile-api/user/switch-apartment',
  GUEST_HISTORY: '/api/mobile-api/user/guests/history',
  ACTIVE_GUESTS: '/api/mobile-api/user/guests/active',
  TOGGLE_GUEST_ACTIVE: '/api/mobile-api/user/guests',  // + /:id/toggle-active
  DELETE_GUEST: '/api/mobile-api/user/guests',  // + /:id

  // ============================================
  // Security QR Scanning (NEW)
  // ============================================
  SCAN_QR: '/api/mobile-api/security/scan-qr',
  QR_SCAN_HISTORY: '/api/mobile-api/security/scan-history',

  // ============================================
  // Members Management (NEW)
  // ============================================
  MEMBERS_LIST: '/api/mobile-api/user/members',
  ADD_MEMBER: '/api/mobile-api/user/members',
  UPDATE_MEMBER: '/api/mobile-api/user/members',
  DELETE_MEMBER: '/api/mobile-api/user/members',

   // ============================================
  // Room Management (NEW)
  // ============================================
  ROOMS_LIST: '/api/mobile-api/user/rooms',
  CREATE_ROOM: '/api/mobile-api/user/rooms',
  UPDATE_ROOM: '/api/mobile-api/user/rooms', // + /:id
  DELETE_ROOM: '/api/mobile-api/user/rooms', // + /:id
  APPROVE_ROOM: '/api/mobile-api/user/rooms', // + /:id/approve
  REJECT_ROOM: '/api/mobile-api/user/rooms', // + /:id/reject

  // Room Accessories
  ROOM_ACCESSORIES_LIST: (roomId) => `/api/mobile-api/user/rooms/${roomId}/accessories`,
  ADD_ROOM_ACCESSORY: (roomId) => `/api/mobile-api/user/rooms/${roomId}/accessories`,
  UPDATE_ROOM_ACCESSORY: (roomId, accessoryId) => `/api/mobile-api/user/rooms/${roomId}/accessories/${accessoryId}`,
  DELETE_ROOM_ACCESSORY: (roomId, accessoryId) => `/api/mobile-api/user/rooms/${roomId}/accessories/${accessoryId}`,
  APPROVE_ROOM_ACCESSORY: (roomId, accessoryId) => `/api/mobile-api/user/rooms/${roomId}/accessories/${accessoryId}/approve`,

  // Replacement History
  ROOM_REPLACEMENT_HISTORY: (roomId) => `/api/mobile-api/user/rooms/${roomId}/replacement-history`,
  ADD_REPLACEMENT: (roomId) => `/api/mobile-api/user/rooms/${roomId}/replacement-history`,
  UPDATE_REPLACEMENT: (roomId, replacementId) => `/api/mobile-api/user/rooms/${roomId}/replacement-history/${replacementId}`,
  DELETE_REPLACEMENT: (roomId, replacementId) => `/api/mobile-api/user/rooms/${roomId}/replacement-history/${replacementId}`,
  APPROVE_REPLACEMENT: (roomId, replacementId) => `/api/mobile-api/user/rooms/${roomId}/replacement-history/${replacementId}/approve`,

  // Rent Sessions
  RENT_SESSIONS_LIST: '/api/mobile-api/user/rent-sessions',
  RENT_SESSION_DETAILS: (sessionId) => `/api/mobile-api/user/rent-sessions/${sessionId}`,
  RENT_SESSION_DOCUMENTS: '/api/mobile-api/user/rent-sessions/documents',
  RENT_SESSION_DOCUMENTS_LIST: (sessionId) => `/api/mobile-api/user/rent-sessions/documents?sessionId=${sessionId}`,


  DISPUTES: '/api/mobile-api/disputes',
  CREATE_DISPUTE: '/api/mobile-api/disputes',
  DISPUTE_DETAILS: (disputeId) => `/api/mobile-api/disputes/${disputeId}`,
  DISPUTE_CHAT: (disputeId) => `/api/mobile-api/disputes/${disputeId}/chat`,
  ESCALATE_DISPUTE: (disputeId) => `/api/mobile-api/disputes/${disputeId}/escalate`,
  RESOLVE_DISPUTE: (disputeId) => `/api/mobile-api/disputes/${disputeId}/resolve`,
   // ============================================
  // Community Posts & Social (NEW)
  // ============================================
  COMMUNITY_POSTS: '/api/mobile-api/user/community-posts',
  COMMUNITY_POST_DETAILS: (postId) => `/api/mobile-api/user/community-posts/${postId}`,
  COMMUNITY_COMMENTS: '/api/mobile-api/user/community-posts/comments',
  COMMUNITY_REPORT: '/api/mobile-api/user/community-posts/report',
  CREATE_COMMUNITY_POST: '/api/mobile-api/user/community-posts',
  LIKE_POST: '/api/mobile-api/user/community-posts/like',
  LIKE_COMMENT: '/api/mobile-api/user/community-posts/comments/like',

  // ============================================
  // Classifieds/Marketplace (NEW)
  // ============================================
  CLASSIFIEDS: '/api/mobile-api/user/classifieds',
  CLASSIFIED_DETAILS: (classifiedId) => `/api/mobile-api/user/classifieds/${classifiedId}`,
  LIKE_CLASSIFIED: '/api/mobile-api/user/classifieds/like',
  CLASSIFIED_COMMENTS: '/api/mobile-api/user/classifieds/comments',

  USER_HOME: '/api/mobile-api/user/home',
};

// Secure Storage Keys
// IMPORTANT: Keys must only contain alphanumeric characters, ".", "-", and "_"
// The "@" symbol is NOT allowed by expo-secure-store
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'gatewise_auth_token',
  USER_TYPE: 'gatewise_user_type',
  USER_DATA: 'gatewise_user_data',
  COMMUNITY_ID: 'gatewise_community_id',
};

// User Types
export const USER_TYPES = {
  SECURITY: 'security',
  USER: 'user',
  RESIDENT: 'user',     // Alias
  ADMIN: 'admin',
};

// Request Timeout (in milliseconds)
export const REQUEST_TIMEOUT = 30000;

// App Version
export const APP_VERSION = '1.0.0';

// Helper function to build full API URL
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Helper function for API headers
export const getApiHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-App-Version': APP_VERSION,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Photo Upload Configuration
export const PHOTO_CONFIG = {
  UPLOAD_URL: 'https://wowfy.in/gatewise/upload.php',
  BASE_URL: 'https://wowfy.in/gatewise/guest_images/',
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  QUALITY: 0.7,
};

// Helper function to build photo URL
export const buildPhotoUrl = (filename) => {
  if (!filename) return null;
  return `${PHOTO_CONFIG.BASE_URL}${filename}`;
};

// Validation Helpers
export const validators = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  mobileNumber: (mobile) => {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
  },
  
  password: (password) => {
    return password.length >= 6;
  },
  
  name: (name) => {
    return name.trim().length >= 2;
  },
};