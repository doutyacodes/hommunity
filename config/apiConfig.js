// ============================================
// FILE: config/apiConfig.js
// Mobile App API Configuration - UPDATED with Apartment Requests
// ============================================

// API Base URL
export const API_BASE_URL = 'https://gatewise.vercel.app';
// export const API_BASE_URL = 'http://192.168.1.4:3000';

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