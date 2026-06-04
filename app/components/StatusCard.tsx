import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface StatusCardProps {
  status: 'SUCCESS' | 'FAILURE';
  name?: string;
  timestamp?: string;
  onRetry?: () => void;
}

export function StatusCard({ status, name, timestamp, onRetry }: StatusCardProps) {
  const isSuccess = status === 'SUCCESS';

  return (
    <View style={[theme.styles.card, styles.container]}>
      <View style={styles.contentRow}>
        {/* Left Action Icon */}
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: isSuccess ? theme.colors.successBg : theme.colors.errorBg },
          ]}
        >
          <Text
            style={[
              styles.icon,
              { color: isSuccess ? theme.colors.success : theme.colors.error },
            ]}
          >
            {isSuccess ? 'check_circle' : 'cancel'}
          </Text>
        </View>

        {/* Center Text Details */}
        <View style={styles.textContainer}>
          <Text style={styles.statusTitle}>
            {isSuccess ? 'Verified Successfully' : 'Not Recognised'}
          </Text>
          {isSuccess ? (
            <>
              <Text style={styles.nameText}>{name}</Text>
              <Text style={styles.timestampText}>{timestamp}</Text>
            </>
          ) : (
            <Text style={styles.mutedText}>Please try again or contact admin</Text>
          )}
        </View>

        {/* Right Badge (For success) */}
        {isSuccess && (
          <View style={[theme.styles.badge, styles.successBadge]}>
            <Text style={[theme.styles.badgeText, styles.successBadgeText]}>Present</Text>
          </View>
        )}
      </View>

      {/* Try Again Button for failure */}
      {!isSuccess && onRetry && (
        <TouchableOpacity
          style={[theme.styles.buttonOutline, styles.retryButton]}
          onPress={onRetry}
        >
          <Text style={theme.styles.buttonOutlineText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  nameText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  timestampText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  mutedText: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  successBadge: {
    backgroundColor: theme.colors.successBg,
    alignSelf: 'center',
  },
  successBadgeText: {
    color: theme.colors.success,
  },
  retryButton: {
    marginTop: 14,
    width: '100%',
  },
});
