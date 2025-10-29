// ============================================
// FILE: services/authService.js
// Authentication Service for Mobile App - UPDATED
// ============================================
import {
  API_ENDPOINTS,
  buildApiUrl,
  getApiHeaders,
  REQUEST_TIMEOUT,
  STORAGE_KEYS
} from '@/config/apiConfig';
import * as SecureStore from 'expo-secure-store';

// Save auth data to secure storage
export const saveAuthData = async (token, userData) => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_TYPE, userData.userType);
    await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    
    // Only save community ID if it exists (for admins/security)
    if (userData.communityId) {
      await SecureStore.setItemAsync(STORAGE_KEYS.COMMUNITY_ID, userData.communityId.toString());
    }
    
    return true;
  } catch (error) {
    console.error('Error saving auth data:', error);
    return false;
  }
};

// Get auth token from secure storage
export const getAuthToken = async () => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get user data from secure storage
export const getUserData = async () => {
  try {
    const userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// Get user type from secure storage
export const getUserType = async () => {
  try {
    return await SecureStore.getItemAsync(STORAGE_KEYS.USER_TYPE);
  } catch (error) {
    console.error('Error getting user type:', error);
    return null;
  }
};

// Get community ID from secure storage
export const getCommunityId = async () => {
  try {
    const communityId = await SecureStore.getItemAsync(STORAGE_KEYS.COMMUNITY_ID);
    return communityId ? parseInt(communityId) : null;
  } catch (error) {
    console.error('Error getting community ID:', error);
    return null;
  }
};

// Clear all auth data (logout)
export const clearAuthData = async () => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_TYPE);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.COMMUNITY_ID);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token;
};

// ============================================
// 🔐 SECURITY LOGIN
// ============================================
export const securityLogin = async (username, password) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.SECURITY_LOGIN),
      {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.success && data.data) {
      // Save auth data to secure storage
      const saved = await saveAuthData(data.data.token, data.data.user);
      
      if (!saved) {
        throw new Error('Failed to save authentication data');
      }

      return {
        success: true,
        data: data.data,
      };
    }

    throw new Error('Invalid response from server');

  } catch (error) {
    console.error('Security login error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: error.message || 'Login failed. Please try again.',
    };
  }
};

// ============================================
// 👤 USER/RESIDENT LOGIN (Email & Password)
// ============================================
export const userLogin = async (email, password) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    console.log('📲 Attempting user login with email:', email);

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.USER_LOGIN),
      {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    if (data.success && data.data) {
      // Save auth data to secure storage
      const saved = await saveAuthData(data.data.token, data.data.user);
      
      if (!saved) {
        throw new Error('Failed to save authentication data');
      }

      console.log('✅ User login successful');

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    }

    throw new Error('Invalid response from server');

  } catch (error) {
    console.error('❌ User login error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: error.message || 'Login failed. Please try again.',
    };
  }
};

// ============================================
// ✍️ USER SIGNUP (Email & Password)
// ============================================
export const userSignup = async (name, email, mobileNumber, password) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    console.log('📝 Attempting user signup with email:', email);

    const response = await fetch(
      buildApiUrl(API_ENDPOINTS.USER_SIGNUP),
      {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ name, email, mobileNumber, password }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Signup failed');
    }

    if (data.success && data.data) {
      // Save auth data to secure storage
      const saved = await saveAuthData(data.data.token, data.data.user);
      
      if (!saved) {
        throw new Error('Failed to save authentication data');
      }

      console.log('✅ User signup successful');

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    }

    throw new Error('Invalid response from server');

  } catch (error) {
    console.error('❌ User signup error:', error);
    
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout. Please check your internet connection.',
      };
    }

    return {
      success: false,
      error: error.message || 'Signup failed. Please try again.',
    };
  }
};

// ============================================
// 🚪 LOGOUT
// ============================================
export const logout = async () => {
  try {
    const token = await getAuthToken();
    
    // Call logout API (optional)
    if (token) {
      try {
        await fetch(
          buildApiUrl(API_ENDPOINTS.LOGOUT),
          {
            method: 'POST',
            headers: getApiHeaders(token),
          }
        );
      } catch (error) {
        console.log('Logout API call failed, clearing local data anyway');
      }
    }

    // Clear local auth data
    await clearAuthData();
    
    return {
      success: true,
    };
  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      error: 'Logout failed. Please try again.',
    };
  }
};

// ============================================
// ✅ VALIDATE TOKEN
// ============================================
export const validateToken = async () => {
  try {
    const token = await getAuthToken();
    
    if (!token) {
      return false;
    }

    // You can add an API call here to validate the token with backend
    // For now, just check if it exists
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
};