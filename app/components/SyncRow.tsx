import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface SyncRowProps {
  name: string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
  synced: boolean;
}

export function SyncRow({ name, status, timestamp, synced }: SyncRowProps) {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('default', { month: 'short' });

  const isPending = !synced;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Left: Date Block */}
        <View style={styles.dateBlock}>
          <Text style={styles.dayText}>{day}</Text>
          <Text style={styles.monthText}>{month}</Text>
        </View>

        {/* Center: Details */}
        <View style={styles.detailsBlock}>
          <Text style={styles.nameText}>{name}</Text>
          <Text style={styles.statusSubtext}>
            {status === 'SUCCESS' ? 'Authenticated' : 'Verification Failed'}
          </Text>
        </View>

        {/* Right: Status Badge & Chevron */}
        <View style={styles.rightBlock}>
          <View
            style={[
              theme.styles.badge,
              {
                backgroundColor: isPending ? theme.colors.warningBg : theme.colors.successBg,
              },
            ]}
          >
            <Text
              style={[
                theme.styles.badgeText,
                { color: isPending ? theme.colors.warning : theme.colors.success },
              ]}
            >
              {isPending ? 'Pending' : 'Synced'}
            </Text>
          </View>
          <Text style={styles.chevron}>chevron_right</Text>
        </View>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  dateBlock: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  monthText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  detailsBlock: {
    flex: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statusSubtext: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevron: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 20,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    width: '100%',
  },
});
