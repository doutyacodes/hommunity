// ============================================
// FILE: app/(security)/security/scan-qr-improved.jsx
// QR Scanner with Expo Camera Integration
// INSTRUCTIONS: Replace scan-qr.jsx with this file
// ============================================
import SafeAreaWrapper from '@/components/SafeAreaWrapper';
import theme from '@/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  CheckCircle,
  ChevronLeft,
  Flashlight,
  RotateCw,
  Scan,
  XCircle
} from 'lucide-react-native';
import { useState, useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View, Vibration, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut } from 'react-native-reanimated';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { buildApiUrl, getApiHeaders } from '@/config/apiConfig';
import { getAuthToken } from '@/services/authService';

const { width } = Dimensions.get('window');

export default function ScanQRScreen() {
  const router = useRouter();
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null); // 'success' or 'error'
  const [resultData, setResultData] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const scanTimeoutRef = useRef(null);

  // Request camera permission on mount
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || processing) return; // Prevent duplicate scans

    setScanned(true);
    setProcessing(true);
    setScanning(false);

    // Vibrate on scan
    Vibration.vibrate(100);

    console.log('QR Code scanned:', { type, data });

    try {
      // Call API to verify QR code
      const token = await getAuthToken();

      const response = await fetch(
        buildApiUrl('/api/mobile-api/security/scan-qr'),
        {
          method: 'POST',
          headers: getApiHeaders(token),
          body: JSON.stringify({
            encryptedQRData: data, // The scanned QR code data
          }),
        }
      );

      const apiResult = await response.json();

      if (apiResult.success && apiResult.accessGranted) {
        // Success - Access Granted
        setResult('success');
        setResultData(apiResult.guestInfo);

        // Success vibration pattern
        Vibration.vibrate([100, 50, 100]);

        // Auto redirect after 3 seconds
        scanTimeoutRef.current = setTimeout(() => {
          router.back();
        }, 3000);
      } else {
        // Error - Access Denied or Invalid QR
        setResult('error');
        setResultData({
          reason: apiResult.reason || 'Access Denied',
          message: apiResult.message || 'Invalid or expired QR code',
          guestInfo: apiResult.guestInfo || null,
        });

        // Error vibration pattern
        Vibration.vibrate([100, 50, 100, 50, 100]);

        // Auto enable retry after 3 seconds
        scanTimeoutRef.current = setTimeout(() => {
          handleRetry();
        }, 3000);
      }
    } catch (error) {
      console.error('Error verifying QR code:', error);

      setResult('error');
      setResultData({
        reason: 'Connection Error',
        message: 'Failed to verify QR code. Please try again.',
      });

      // Error vibration
      Vibration.vibrate([100, 50, 100, 50, 100]);

      // Auto enable retry after 3 seconds
      scanTimeoutRef.current = setTimeout(() => {
        handleRetry();
      }, 3000);
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setScanning(true);
    setResult(null);
    setResultData(null);
    setScanned(false);

    // Clear any pending timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
  };

  // Handle permission states
  if (!permission) {
    return (
      <SafeAreaWrapper backgroundColor="#000000">
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaWrapper>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaWrapper backgroundColor="#000000">
        <View style={styles.permissionContainer}>
          <Scan size={64} color={theme.colors.primary.blue} />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionMessage}>
            GateWise needs camera access to scan QR codes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.permissionButtonGradient}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToManualButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backToManualText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper backgroundColor="#000000">
      <StatusBar style="light" />

      <View style={styles.container}>
        {/* Header */}
        <Animated.View
          entering={FadeInUp.duration(600)}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan QR Code</Text>
          <TouchableOpacity
            style={styles.flashButton}
            onPress={() => setFlashOn(!flashOn)}
          >
            <Flashlight
              size={24}
              color={flashOn ? '#FFD700' : '#FFFFFF'}
              fill={flashOn ? '#FFD700' : 'transparent'}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Camera Container */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
            enableTorch={flashOn}
          >
            {/* Scanner Frame Overlay */}
            <View style={styles.scannerOverlay}>
              <Animated.View
                entering={FadeIn.duration(800)}
                style={styles.scannerFrame}
              >
                {/* Corner Borders */}
                <View style={[styles.corner, styles.cornerTopLeft]} />
                <View style={[styles.corner, styles.cornerTopRight]} />
                <View style={[styles.corner, styles.cornerBottomLeft]} />
                <View style={[styles.corner, styles.cornerBottomRight]} />

                {/* Scanning Line Animation */}
                {scanning && !result && (
                  <Animated.View
                    entering={FadeIn.duration(1000).delay(200)}
                    style={styles.scanLine}
                  />
                )}

                {/* Success/Error Overlay */}
                {result && (
                  <Animated.View
                    entering={FadeIn.duration(400)}
                    exiting={FadeOut.duration(400)}
                    style={[
                      styles.resultOverlay,
                      result === 'success'
                        ? styles.resultOverlaySuccess
                        : styles.resultOverlayError
                    ]}
                  >
                    {result === 'success' ? (
                      <>
                        <CheckCircle size={64} color="#10B981" strokeWidth={2} />
                        <Text style={styles.resultText}>Access Granted!</Text>
                        {resultData && (
                          <View style={styles.guestInfoContainer}>
                            <Text style={styles.guestName}>{resultData.guestName}</Text>
                            <Text style={styles.guestDetail}>
                              {resultData.apartmentNumber}
                              {resultData.towerName && ` - ${resultData.towerName}`}
                            </Text>
                            {resultData.purpose && (
                              <Text style={styles.guestDetail}>{resultData.purpose}</Text>
                            )}
                          </View>
                        )}
                      </>
                    ) : (
                      <>
                        <XCircle size={64} color="#EF4444" strokeWidth={2} />
                        <Text style={styles.resultText}>
                          {resultData?.reason || 'Access Denied'}
                        </Text>
                        {resultData?.message && (
                          <Text style={styles.resultMessage}>{resultData.message}</Text>
                        )}
                        {resultData?.guestInfo && (
                          <View style={styles.guestInfoContainer}>
                            <Text style={styles.guestName}>
                              {resultData.guestInfo.guestName}
                            </Text>
                            <Text style={styles.guestDetail}>
                              {resultData.guestInfo.apartmentNumber}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </Animated.View>
                )}
              </Animated.View>
            </View>
          </CameraView>
        </View>

        {/* Instructions */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(400)}
          style={styles.instructionsContainer}
        >
          <View style={styles.instructionCard}>
            <Scan size={24} color={theme.colors.primary.blue} />
            <Text style={styles.instructionText}>
              {scanning
                ? 'Position QR code within the frame'
                : processing
                ? 'Verifying QR code...'
                : result === 'success'
                ? 'Entry approved - Redirecting...'
                : 'Scan again or go back'}
            </Text>
          </View>
        </Animated.View>

        {/* Bottom Actions */}
        <Animated.View
          entering={FadeInUp.duration(800).delay(500)}
          style={styles.bottomActions}
        >
          {result && !processing && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.retryButtonGradient}
              >
                <RotateCw size={20} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Scan Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Manual Entry Option */}
          <TouchableOpacity
            style={styles.manualButton}
            onPress={() => router.push('/security/upload-guest')}
          >
            <Text style={styles.manualButtonText}>Enter Details Manually</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  permissionTitle: {
    fontSize: 24,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  permissionMessage: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
  },
  permissionText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.regular,
    color: '#FFFFFF',
  },
  permissionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  permissionButtonGradient: {
    paddingVertical: theme.spacing.base,
    paddingHorizontal: theme.spacing.xxxl,
  },
  permissionButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
  backToManualButton: {
    paddingVertical: theme.spacing.base,
  },
  backToManualText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semibold,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
  flashButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Camera
  cameraContainer: {
    flex: 1,
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: width - 120,
    height: width - 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Corner Borders
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#3B82F6',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },

  // Scan Line
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },

  // Result Overlay
  resultOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    padding: theme.spacing.xl,
  },
  resultOverlaySuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  resultOverlayError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  resultText: {
    fontSize: 20,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
    marginTop: theme.spacing.base,
    textAlign: 'center',
  },
  resultMessage: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  guestInfoContainer: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
  },
  guestName: {
    fontSize: 18,
    fontFamily: theme.typography.fonts.semibold,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  guestDetail: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
  },

  // Instructions
  instructionsContainer: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontFamily: theme.typography.fonts.medium,
    color: '#FFFFFF',
  },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.md,
  },
  retryButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.base,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: theme.typography.fonts.bold,
    color: '#FFFFFF',
  },
  manualButton: {
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semibold,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
