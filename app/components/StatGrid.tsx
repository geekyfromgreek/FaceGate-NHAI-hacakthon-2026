import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface StatGridProps {
  verificationsCount: number;
  failedCount: number;
  lastVerified: string;
  isOnline: boolean;
}

export function StatGrid({
  verificationsCount,
  failedCount,
  lastVerified,
  isOnline,
}: StatGridProps) {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.row}>
        {/* Stat 1 */}
        <View style={[theme.styles.card, styles.cell]}>
          <Text style={styles.statNumber}>{verificationsCount}</Text>
          <Text style={styles.statLabel}>Verifications Today</Text>
        </View>

        {/* Stat 2 */}
        <View style={[theme.styles.card, styles.cell]}>
          <Text style={[styles.statNumber, { color: failedCount > 0 ? theme.colors.error : theme.colors.textPrimary }]}>
            {failedCount}
          </Text>
          <Text style={styles.statLabel}>Failed Attempts</Text>
        </View>
      </View>

      <View style={styles.row}>
        {/* Stat 3 */}
        <View style={[theme.styles.card, styles.cell]}>
          <Text style={[styles.statNumber, styles.smallStatNumber]}>{lastVerified}</Text>
          <Text style={styles.statLabel}>Last Verified</Text>
        </View>

        {/* Stat 4 */}
        <View style={[theme.styles.card, styles.cell]}>
          <View style={styles.onlineWrapper}>
            <View
              style={[
                styles.dot,
                { backgroundColor: isOnline ? theme.colors.success : theme.colors.warning },
              ]}
            />
            <Text style={styles.statNumber}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Text style={styles.statLabel}>Sync Mode</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: '100%',
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  cell: {
    flex: 1,
    padding: 14,
    minHeight: 85,
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  smallStatNumber: {
    fontSize: 14,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  onlineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
