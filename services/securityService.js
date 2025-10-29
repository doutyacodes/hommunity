// ============================================
// FILE: services/securityService.js
// Complete Security API Service - Production Ready
// ============================================
import {
    API_ENDPOINTS,
    buildApiUrl,
    buildPhotoUrl,
    getApiHeaders,
    PHOTO_CONFIG,
    STORAGE_KEYS,
} from '@/config/apiConfig';
import * as SecureStore from 'expo-secure-store';

/**
 * Security Service - Handles all security-related API calls
 * Used by security staff mobile app for gate management
 */
class SecurityService {
  /**
   * Get authentication token from secure storage
   * @private
   * @returns {Promise<string|null>} JWT token or null
   */
  async getAuthToken() {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      return token;
    } catch (error) {
      console.error('❌ Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Fetch all apartments in security's community
   * @returns {Promise<Object>} Response with apartments array
   * @example
   * const result = await securityService.fetchApartments();
   * if (result.success) {
   *   console.log(result.apartments); // Array of apartments
   * }
   */
  async fetchApartments() {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const url = buildApiUrl(API_ENDPOINTS.GET_APARTMENTS);
      const headers = getApiHeaders(token);

      console.log('📋 Fetching apartments...');

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch apartments');
      }

      console.log(`✅ Loaded ${data.count} apartments`);

      return {
        success: true,
        apartments: data.apartments,
        count: data.count,
      };
    } catch (error) {
      console.error('❌ Fetch Apartments Error:', error);
      return {
        success: false,
        error: error.message,
        apartments: [],
        count: 0,
      };
    }
  }

  /**
   * Upload photo to PHP server
   * @param {string} uri - Photo URI from camera
   * @returns {Promise<Object>} Response with filename
   * @example
   * const result = await securityService.uploadPhoto(photoUri);
   * if (result.success) {
   *   console.log(result.filename); // "guest_1234567890.jpg"
   * }
   */
  async uploadPhoto(uri) {
    try {
      console.log('📸 Uploading photo...');

      const formData = new FormData();
      formData.append('guestImage', {
        uri: uri,
        type: 'image/jpeg',
        name: `photo_${Date.now()}.jpg`,
      });

      const response = await fetch(PHOTO_CONFIG.UPLOAD_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const Pureresponse = await response;
            console.log("photo data",Pureresponse)

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Photo upload failed');
      }

      console.log('✅ Photo uploaded:', data.imagePath);

      return {
        success: true,
        filename: data.imagePath,
        fullUrl: buildPhotoUrl(data.imagePath),
      };
    } catch (error) {
      console.error('❌ Upload Photo Error:', error);
      return {
        success: false,
        error: error.message,
        filename: null,
      };
    }
  }

  /**
   * Create guest entry
   * @param {Object} guestData - Guest information
   * @param {string} guestData.guestName - Name of guest (required)
   * @param {string} guestData.guestPhone - Phone number (optional)
   * @param {number} guestData.apartmentId - Apartment ID (required)
   * @param {string} guestData.vehicleNumber - Vehicle number (optional)
   * @param {string} guestData.purpose - Purpose of visit (optional)
   * @param {string} guestData.photoFilename - Photo filename (required)
   * @returns {Promise<Object>} Response with guest ID and QR code
   * @example
   * const result = await securityService.createGuestEntry({
   *   guestName: "John Doe",
   *   guestPhone: "9876543210",
   *   apartmentId: 2,
   *   vehicleNumber: "KA01AB1234",
   *   purpose: "Personal visit",
   *   photoFilename: "guest_123.jpg"
   * });
   */
  async createGuestEntry(guestData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const {
        guestName,
        guestPhone,
        apartmentId,
        vehicleNumber,
        purpose,
        photoFilename,
      } = guestData;

      // Validate required fields
      if (!guestName || !apartmentId || !photoFilename) {
        throw new Error('Guest name, apartment, and photo are required');
      }

      console.log('👤 Creating guest entry...');

      const url = buildApiUrl(API_ENDPOINTS.CREATE_GUEST_ENTRY);
      const headers = getApiHeaders(token);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          guestName: guestName.trim(),
          guestPhone: guestPhone?.trim() || null,
          apartmentId: apartmentId,
          vehicleNumber: vehicleNumber?.trim() || null,
          purpose: purpose?.trim() || null,
          photoFilename: photoFilename,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create guest entry');
      }

      console.log('✅ Guest entry created:', data.data.guestId);

      return {
        success: true,
        guestId: data.data.guestId,
        qrCode: data.data.qrCode,
        status: data.data.status,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Create Guest Entry Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create delivery entry
   * @param {Object} deliveryData - Delivery information
   * @param {string} deliveryData.deliveryPersonName - Name of delivery person (required)
   * @param {string} deliveryData.companyName - Company name (required)
   * @param {string} deliveryData.companyLogo - Company logo filename (optional)
   * @param {string} deliveryData.vehicleNumber - Vehicle number (optional)
   * @param {string} deliveryData.purpose - Delivery purpose (optional)
   * @param {string} deliveryData.photoFilename - Photo filename (required)
   * @returns {Promise<Object>} Response with delivery ID
   * @example
   * const result = await securityService.createDeliveryEntry({
   *   deliveryPersonName: "Ramesh",
   *   companyName: "Amazon",
   *   companyLogo: "amazon.png",
   *   vehicleNumber: "KA05XY9876",
   *   purpose: "Package delivery",
   *   photoFilename: "delivery_123.jpg"
   * });
   */
  async createDeliveryEntry(deliveryData) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const {
        deliveryPersonName,
        companyName,
        companyLogo,
        vehicleNumber,
        purpose,
        photoFilename,
      } = deliveryData;

      // Validate required fields
      if (!deliveryPersonName || !companyName || !photoFilename) {
        throw new Error('Delivery person, company, and photo are required');
      }

      console.log('📦 Creating delivery entry...');

      const url = buildApiUrl(API_ENDPOINTS.CREATE_DELIVERY_ENTRY);
      const headers = getApiHeaders(token);

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          deliveryPersonName: deliveryPersonName.trim(),
          companyName: companyName.trim(),
          companyLogo: companyLogo || 'courier.png',
          vehicleNumber: vehicleNumber?.trim() || null,
          purpose: purpose?.trim() || null,
          photoFilename: photoFilename,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create delivery entry');
      }

      console.log('✅ Delivery entry created:', data.data.deliveryId);

      return {
        success: true,
        deliveryId: data.data.deliveryId,
        entryTime: data.data.entryTime,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ Create Delivery Entry Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fetch delivery logs (paginated)
   * @param {number} limit - Number of records to fetch (default: 50)
   * @param {number} offset - Offset for pagination (default: 0)
   * @returns {Promise<Object>} Response with delivery logs
   * @example
   * const result = await securityService.fetchDeliveryLogs(50, 0);
   * if (result.success) {
   *   console.log(result.logs); // Array of delivery logs
   * }
   */
  async fetchDeliveryLogs(limit = 50, offset = 0) {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const url = `${buildApiUrl(
        API_ENDPOINTS.GET_DELIVERY_LOGS
      )}?limit=${limit}&offset=${offset}`;

      const headers = getApiHeaders(token);

      console.log(`📜 Fetching delivery logs (limit: ${limit}, offset: ${offset})...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch delivery logs');
      }

      console.log(`✅ Loaded ${data.data.logs.length} delivery logs`);

      return {
        success: true,
        logs: data.data.logs,
        limit: data.data.limit,
        offset: data.data.offset,
      };
    } catch (error) {
      console.error('❌ Fetch Delivery Logs Error:', error);
      return {
        success: false,
        error: error.message,
        logs: [],
      };
    }
  }

  /**
   * Complete workflow: Upload photo + Create guest entry
   * This is the recommended method for creating guest entries
   * @param {string} photoUri - Photo URI from camera
   * @param {Object} guestData - Guest information (without photoFilename)
   * @returns {Promise<Object>} Complete response
   * @example
   * const result = await securityService.createGuestWithPhoto(photoUri, {
   *   guestName: "John Doe",
   *   guestPhone: "9876543210",
   *   apartmentId: 2,
   *   vehicleNumber: "KA01AB1234",
   *   purpose: "Personal visit"
   * });
   */
  async createGuestWithPhoto(photoUri, guestData) {
    try {
      console.log('🚀 Starting guest entry workflow...');

      // Step 1: Upload photo
      const uploadResult = await this.uploadPhoto(photoUri);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Photo upload failed');
      }

      // Step 2: Create guest entry with photo filename
      const guestResult = await this.createGuestEntry({
        ...guestData,
        photoFilename: uploadResult.filename,
      });

      if (!guestResult.success) {
        throw new Error(guestResult.error || 'Failed to create guest entry');
      }

      console.log('🎉 Guest entry workflow completed successfully!');

      return {
        success: true,
        guestId: guestResult.guestId,
        qrCode: guestResult.qrCode,
        status: guestResult.status,
        photoUrl: uploadResult.fullUrl,
        message: 'Guest entry created successfully',
      };
    } catch (error) {
      console.error('❌ Create Guest With Photo Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Complete workflow: Upload photo + Create delivery entry
   * This is the recommended method for creating delivery entries
   * @param {string} photoUri - Photo URI from camera
   * @param {Object} deliveryData - Delivery information (without photoFilename)
   * @returns {Promise<Object>} Complete response
   * @example
   * const result = await securityService.createDeliveryWithPhoto(photoUri, {
   *   deliveryPersonName: "Ramesh",
   *   companyName: "Amazon",
   *   companyLogo: "amazon.png",
   *   vehicleNumber: "KA05XY9876",
   *   purpose: "Package delivery"
   * });
   */
  async createDeliveryWithPhoto(photoUri, deliveryData) {
    try {
      console.log('🚀 Starting delivery entry workflow...');

      // Step 1: Upload photo
      const uploadResult = await this.uploadPhoto(photoUri);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Photo upload failed');
      }

      // Step 2: Create delivery entry with photo filename
      const deliveryResult = await this.createDeliveryEntry({
        ...deliveryData,
        photoFilename: uploadResult.filename,
      });

      if (!deliveryResult.success) {
        throw new Error(
          deliveryResult.error || 'Failed to create delivery entry'
        );
      }

      console.log('🎉 Delivery entry workflow completed successfully!');

      return {
        success: true,
        deliveryId: deliveryResult.deliveryId,
        entryTime: deliveryResult.entryTime,
        photoUrl: uploadResult.fullUrl,
        message: 'Delivery entry created successfully',
      };
    } catch (error) {
      console.error('❌ Create Delivery With Photo Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Export singleton instance
export default new SecurityService();

// Also export the class for testing purposes
export { SecurityService };

