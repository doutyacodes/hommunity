// ============================================
// FILE: components/user/GuestCard.jsx
// Guest Card Component for Lists
// Modern, clean design with no shadows
// ============================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '@/theme';
import { formatDate, formatTime, getRelativeTime } from '@/utils/dateHelpers';

export default function GuestCard({ guest, onPress, showActions = false, onToggleActive, onDelete, onShowQR }) {
  const getGuestTypeIcon = () => {
    switch (guest.guestType) {
      case 'frequent':
        return 'repeat';
      case 'one_time':
        return 'person';
      default:
        return 'person-outline';
    }
  };

  const getApprovalTypeColor = () => {
    switch (guest.approvalType) {
      case 'preapproved':
        return colors.status.success;
      case 'private':
        return colors.primary.purple;
      case 'needs_approval':
        return colors.status.warning;
      default:
        return colors.text.tertiary;
    }
  };

  const getStatusColor = () => {
    switch (guest.status) {
      case 'approved':
        return colors.status.success;
      case 'pending':
        return colors.status.warning;
      case 'denied':
        return colors.status.error;
      case 'expired':
        return colors.text.disabled;
      default:
        return colors.text.tertiary;
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: `${getApprovalTypeColor()}15` },
            ]}
          >
            <Ionicons
              name={getGuestTypeIcon()}
              size={20}
              color={getApprovalTypeColor()}
            />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.guestName} numberOfLines={1}>
              {guest.guestName}
            </Text>
            <Text style={styles.guestPhone} numberOfLines={1}>
              {guest.guestPhone || 'No phone'}
            </Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor()}15` },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {guest.status}
          </Text>
        </View>
      </View>

      {/* Details */}
      <View style={styles.details}>
        {/* Date Range */}
        {(guest.startDate || guest.endDate) && (
          <View style={styles.detailRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.text.tertiary}
            />
            <Text style={styles.detailText}>
              {guest.startDate && formatDate(guest.startDate)}
              {guest.startDate && guest.endDate && ' - '}
              {guest.endDate && formatDate(guest.endDate)}
            </Text>
          </View>
        )}

        {/* Total Members */}
        {guest.totalMembers > 1 && (
          <View style={styles.detailRow}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.text.tertiary}
            />
            <Text style={styles.detailText}>
              {guest.totalMembers} people
            </Text>
          </View>
        )}

        {/* Vehicle */}
        {guest.vehicleNumber && (
          <View style={styles.detailRow}>
            <Ionicons
              name="car-outline"
              size={14}
              color={colors.text.tertiary}
            />
            <Text style={styles.detailText}>{guest.vehicleNumber}</Text>
          </View>
        )}

        {/* Approval Type */}
        <View style={styles.detailRow}>
          <Ionicons
            name={
              guest.approvalType === 'preapproved'
                ? 'checkmark-circle-outline'
                : guest.approvalType === 'private'
                ? 'lock-closed-outline'
                : 'hourglass-outline'
            }
            size={14}
            color={colors.text.tertiary}
          />
          <Text style={styles.detailText}>
            {guest.approvalType.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {/* Purpose */}
      {guest.purpose && (
        <View style={styles.purposeContainer}>
          <Text style={styles.purposeText} numberOfLines={2}>
            {guest.purpose}
          </Text>
        </View>
      )}

      {/* Footer - Last Scan or Created */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {guest.lastScannedAt
            ? `Last visit: ${getRelativeTime(guest.lastScannedAt)}`
            : `Created: ${getRelativeTime(guest.createdAt)}`}
        </Text>

        {guest.visitCount > 0 && (
          <View style={styles.visitBadge}>
            <Ionicons name="log-in-outline" size={12} color={colors.primary.blue} />
            <Text style={styles.visitCount}>{guest.visitCount} visits</Text>
          </View>
        )}
      </View>

      {/* Action Buttons for Active Guests */}
      {showActions && (
        <View style={styles.actions}>
          {guest.guestType === 'frequent' && onToggleActive && (
            <TouchableOpacity
              style={[
                styles.actionButton,
                guest.isActive ? styles.deactivateButton : styles.activateButton,
              ]}
              onPress={onToggleActive}
              activeOpacity={0.7}
            >
              <Ionicons
                name={guest.isActive ? 'pause-circle-outline' : 'play-circle-outline'}
                size={18}
                color={guest.isActive ? colors.status.warning : colors.status.success}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: guest.isActive ? colors.status.warning : colors.status.success },
                ]}
              >
                {guest.isActive ? 'Deactivate' : 'Activate'}
              </Text>
            </TouchableOpacity>
          )}

          {onShowQR && (
            <TouchableOpacity
              style={[styles.actionButton, styles.qrButton]}
              onPress={onShowQR}
              activeOpacity={0.7}
            >
              <Ionicons name="qr-code-outline" size={18} color={colors.primary.blue} />
              <Text style={[styles.actionText, { color: colors.primary.blue }]}>
                Show QR
              </Text>
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={onDelete}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={18} color={colors.status.error} />
              <Text style={[styles.actionText, { color: colors.status.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.base,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  guestName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    marginBottom: 2,
  },
  guestPhone: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  statusBadge: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    textTransform: 'capitalize',
  },
  details: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  detailText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  purposeContainer: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  purposeText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: typography.sizes.sm * 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  visitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.primaryShades.blue50,
    paddingVertical: 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.full,
  },
  visitCount: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.primary.blue,
  },
  actions: {
    flexDirection: 'row',
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xxs,
  },
  activateButton: {
    backgroundColor: colors.status.successLight,
    borderColor: colors.status.success,
  },
  deactivateButton: {
    backgroundColor: colors.status.warningLight,
    borderColor: colors.status.warning,
  },
  qrButton: {
    backgroundColor: colors.primaryShades.blue50,
    borderColor: colors.primary.blue,
  },
  deleteButton: {
    backgroundColor: colors.status.errorLight,
    borderColor: colors.status.error,
  },
  actionText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
});
