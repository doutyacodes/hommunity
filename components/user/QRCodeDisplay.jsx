// ============================================
// FILE: components/user/QRCodeDisplay.jsx
// QR Code Display with Download and Share Options
// ============================================

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { colors, typography, spacing, borderRadius } from '@/theme';

export default function QRCodeDisplay({ guestData, encryptedData, size = 200 }) {
  const qrRef = useRef();

  const handleDownload = async () => {
    try {
      // Capture QR code as image
      const uri = await captureRef(qrRef, {
        format: 'png',
        quality: 1,
      });

      // Save to device
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (!permissions.granted) return;

        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await FileSystem.StorageAccessFramework.createFileAsync(
          permissions.directoryUri,
          `Guest_QR_${guestData.guestName}_${Date.now()}.png`,
          'image/png'
        ).then(async (fileUri) => {
          await FileSystem.writeAsStringAsync(fileUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          Alert.alert('Success', 'QR Code saved to downloads');
        });
      } else {
        // iOS
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download QR code');
    }
  };

  const handleShare = async () => {
    try {
      const message = `Guest Pass for ${guestData.guestName}\n\nApartment: ${guestData.apartmentNumber || 'N/A'}\nValid: ${guestData.validFrom ? new Date(guestData.validFrom).toLocaleDateString() : 'Now'} - ${guestData.validUntil ? new Date(guestData.validUntil).toLocaleDateString() : 'Ongoing'}\n\nPlease show this QR code at the gate.`;

      const result = await Share.share({
        message: message,
      });

      if (result.action === Share.sharedAction) {
        console.log('QR code shared successfully');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  return (
    <View style={styles.container}>
      {/* QR Code */}
      <View style={styles.qrContainer} ref={qrRef}>
        <View style={styles.qrWrapper}>
          <QRCode
            value={encryptedData}
            size={size}
            color={colors.text.primary}
            backgroundColor={colors.background.primary}
            logo={require('@/assets/images/icon.png')}
            logoSize={size * 0.2}
            logoBackgroundColor={colors.background.primary}
            logoBorderRadius={10}
          />
        </View>

        {/* Guest Info Below QR */}
        <View style={styles.infoContainer}>
          <Text style={styles.guestName}>{guestData.guestName}</Text>
          {guestData.apartmentNumber && (
            <Text style={styles.apartmentInfo}>
              {guestData.towerName && `${guestData.towerName} `}
              {guestData.apartmentNumber}
            </Text>
          )}
          {guestData.totalMembers > 1 && (
            <View style={styles.membersBadge}>
              <Ionicons name="people" size={14} color={colors.primary.blue} />
              <Text style={styles.membersText}>
                {guestData.totalMembers} people
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.downloadButton]}
          onPress={handleDownload}
          activeOpacity={0.7}
        >
          <Ionicons name="download-outline" size={20} color={colors.background.primary} />
          <Text style={styles.buttonText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.shareButton]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.background.primary} />
          <Text style={styles.buttonText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Validity Info */}
      {(guestData.validFrom || guestData.validUntil) && (
        <View style={styles.validityContainer}>
          <Ionicons name="time-outline" size={16} color={colors.text.secondary} />
          <Text style={styles.validityText}>
            Valid: {guestData.validFrom ? new Date(guestData.validFrom).toLocaleDateString() : 'Now'} - {guestData.validUntil ? new Date(guestData.validUntil).toLocaleDateString() : 'Ongoing'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  qrContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.xl,
    alignItems: 'center',
  },
  qrWrapper: {
    padding: spacing.md,
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.md,
  },
  infoContainer: {
    marginTop: spacing.base,
    alignItems: 'center',
  },
  guestName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.lg,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  apartmentInfo: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  membersBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryShades.blue50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.full,
    marginTop: spacing.xxs,
  },
  membersText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.primary.blue,
    marginLeft: spacing.xxs,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
    minWidth: 140,
  },
  downloadButton: {
    backgroundColor: colors.primary.blue,
  },
  shareButton: {
    backgroundColor: colors.status.success,
  },
  buttonText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.background.primary,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  validityText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
