// ============================================
// FILE: app/security/scan-qr.jsx
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
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ScanQRScreen() {
  const router = useRouter();
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [result, setResult] = useState(null); // 'success' or 'error'

  const handleScanSuccess = () => {
    setScanning(false);
    setResult('success');
    // Auto redirect after 2 seconds
    setTimeout(() => {
      router.back();
    }, 2000);
  };

  const handleScanError = () => {
    setScanning(false);
    setResult('error');
  };

  const handleRetry = () => {
    setScanning(true);
    setResult(null);
  };

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

        {/* Scanner Area */}
        <View style={styles.scannerContainer}>
          {/* Camera Placeholder - Replace with actual camera component */}
          <View style={styles.cameraPlaceholder}>
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
              {scanning && (
                <Animated.View 
                  entering={FadeIn.duration(1000).delay(200)}
                  style={styles.scanLine}
                />
              )}

              {/* Success/Error Overlay */}
              {result && (
                <Animated.View 
                  entering={FadeIn.duration(400)}
                  style={[
                    styles.resultOverlay,
                    result === 'success' 
                      ? styles.resultOverlaySuccess 
                      : styles.resultOverlayError
                  ]}
                >
                  {result === 'success' ? (
                    <CheckCircle size={64} color="#10B981" strokeWidth={2} />
                  ) : (
                    <XCircle size={64} color="#EF4444" strokeWidth={2} />
                  )}
                  <Text style={styles.resultText}>
                    {result === 'success' 
                      ? 'Access Granted!' 
                      : 'Invalid QR Code'}
                  </Text>
                </Animated.View>
              )}
            </Animated.View>
          </View>

          {/* Instructions */}
          <Animated.View 
            entering={FadeInDown.duration(800).delay(400)}
            style={styles.instructionsContainer}
          >
            <View style={styles.instructionCard}>
              <Scan size={24} color={theme.colors.primary.blue} />
              <Text style={styles.instructionText}>
                Position QR code within the frame
              </Text>
            </View>
          </Animated.View>
        </View>

        {/* Bottom Actions */}
        <Animated.View 
          entering={FadeInUp.duration(800).delay(500)}
          style={styles.bottomActions}
        >
          {result ? (
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
          ) : (
            <>
              {/* Test Buttons - Remove in production */}
              <TouchableOpacity
                style={styles.testButton}
                onPress={handleScanSuccess}
              >
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.testButtonText}>Test Success</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.testButton, styles.testButtonError]}
                onPress={handleScanError}
              >
                <XCircle size={20} color="#EF4444" />
                <Text style={[styles.testButtonText, { color: '#EF4444' }]}>
                  Test Error
                </Text>
              </TouchableOpacity>
            </>
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

  // Scanner
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  cameraPlaceholder: {
    width: width - 80,
    height: width - 80,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#1a1a1a',
    overflow: 'hidden',
    position: 'relative',
  },
  scannerFrame: {
    flex: 1,
    margin: 20,
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
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
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
  },

  // Instructions
  instructionsContainer: {
    marginTop: theme.spacing.xl,
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

  // Test Buttons (Remove in production)
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testButtonError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  testButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: '#10B981',
  },

  manualButton: {
    paddingVertical: theme.spacing.base,
    alignItems: 'center',
  },
  manualButtonText: {
    fontSize: 14,
    fontFamily: theme.typography.fonts.semiBold,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});