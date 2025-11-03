// ============================================
// FILE: utils/qrEncryption.js
// QR Code Encryption/Decryption Utilities
// Uses AES-256 encryption for secure QR codes
// ============================================

import CryptoJS from 'crypto-js';

// Secret key - In production, store this securely (env variable)
const SECRET_KEY = 'GateWise2025SecureQRCodeEncryptionKey!@#$%';

/**
 * Encrypt guest data for QR code
 * @param {Object} guestData - Guest information
 * @returns {string} Encrypted string
 */
export function encryptQRData(guestData) {
  try {
    const dataString = JSON.stringify(guestData);
    const encrypted = CryptoJS.AES.encrypt(dataString, SECRET_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error('QR Encryption error:', error);
    throw new Error('Failed to encrypt QR data');
  }
}

/**
 * Decrypt QR code data
 * @param {string} encryptedData - Encrypted QR string
 * @returns {Object} Decrypted guest data
 */
export function decryptQRData(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const dataString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!dataString) {
      throw new Error('Invalid QR code');
    }

    return JSON.parse(dataString);
  } catch (error) {
    console.error('QR Decryption error:', error);
    throw new Error('Invalid or corrupted QR code');
  }
}

/**
 * Generate QR data object for a guest
 * @param {Object} guest - Guest database record
 * @returns {Object} QR data object
 */
export function generateQRDataObject(guest) {
  return {
    guestId: guest.id.toString(),
    apartmentId: guest.apartmentId.toString(),
    communityId: guest.communityId.toString(),
    guestName: guest.guestName,
    guestPhone: guest.guestPhone || '',
    totalMembers: guest.totalMembers || 1,
    guestType: guest.guestType,
    approvalType: guest.approvalType,
    validFrom: guest.startDate ? new Date(guest.startDate).toISOString() : null,
    validUntil: guest.endDate ? new Date(guest.endDate).toISOString() : null,
    vehicleNumber: guest.vehicleNumber || '',
    purpose: guest.purpose || '',
    createdAt: new Date(guest.createdAt).toISOString(),
    // Security signature to prevent tampering
    signature: generateSignature(guest.id, guest.qrCode),
  };
}

/**
 * Generate security signature
 * @param {number} guestId - Guest ID
 * @param {string} qrCode - Original QR code
 * @returns {string} HMAC signature
 */
function generateSignature(guestId, qrCode) {
  const data = `${guestId}-${qrCode}-${SECRET_KEY}`;
  return CryptoJS.HmacSHA256(data, SECRET_KEY).toString();
}

/**
 * Validate QR signature
 * @param {Object} qrData - Decrypted QR data
 * @param {string} expectedQRCode - Expected QR code from database
 * @returns {boolean} Is valid
 */
export function validateQRSignature(qrData, expectedQRCode) {
  try {
    const expectedSignature = generateSignature(qrData.guestId, expectedQRCode);
    return qrData.signature === expectedSignature;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

/**
 * Validate QR code access
 * @param {Object} qrData - Decrypted QR data
 * @param {Object} guest - Guest from database
 * @returns {Object} { isValid, reason }
 */
export function validateQRAccess(qrData, guest) {
  // Check if guest is active
  if (!guest.isActive) {
    return { isValid: false, reason: 'Guest is inactive' };
  }

  // Check if guest status is approved
  if (guest.status !== 'approved' && guest.approvalType !== 'preapproved') {
    return { isValid: false, reason: 'Guest not approved' };
  }

  // Check date validity
  const now = new Date();

  if (qrData.validFrom) {
    const startDate = new Date(qrData.validFrom);
    if (now < startDate) {
      return { isValid: false, reason: 'Access period has not started yet' };
    }
  }

  if (qrData.validUntil) {
    const endDate = new Date(qrData.validUntil);
    if (now > endDate) {
      return { isValid: false, reason: 'Access period has expired' };
    }
  }

  // All checks passed
  return { isValid: true, reason: 'Access granted' };
}

/**
 * Generate unique QR code string
 * @param {number} guestId - Guest ID
 * @param {number} apartmentId - Apartment ID
 * @returns {string} Unique QR code string
 */
export function generateUniqueQRCode(guestId, apartmentId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `GW-${apartmentId}-${guestId}-${timestamp}-${random}`;
}
