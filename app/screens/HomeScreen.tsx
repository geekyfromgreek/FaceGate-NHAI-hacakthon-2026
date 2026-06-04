import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../theme';
import { StatGrid } from '../components/StatGrid';
import { fetchAllLogs } from '../utils/embeddingStore';
import { getNetworkStatus } from '../utils/syncManager';

interface HomeScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');

  useEffect(() => {
    const loadStats = async () => {
      const allLogs = await fetchAllLogs();
      setLogs(allLogs);
      const netStatus = await getNetworkStatus();
      setIsOnline(netStatus);
    };

    loadStats();
    
    // Auto-update values periodically
    const timer = setInterval(loadStats, 2000);
    return () => clearInterval(timer);
  }, []);

  const verificationsToday = logs.filter(l => l.status === 'SUCCESS').length;
  const failedAttempts = logs.filter(l => l.status === 'FAILURE').length;
  
  const lastSuccessLog = [...logs]
    .reverse()
    .find(l => l.status === 'SUCCESS');
    
  const lastVerifiedText = lastSuccessLog
    ? new Date(lastSuccessLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '--';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Navigation Pattern: Header Row */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrowSymbol}>arrow_back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Face Authentication</Text>
        </View>

        {/* Card 1: Action */}
        <View style={theme.styles.card}>
          <View style={styles.actionHeader}>
            <View style={styles.iconBackground}>
              <Text style={styles.faceIconSymbol}>face</Text>
            </View>
            <View style={styles.actionTextWrapper}>
              <Text style={styles.actionTitle}>Mark Attendance</Text>
              <Text style={styles.actionSubtitle}>Tap to verify your identity</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[theme.styles.button, styles.fullWidthBtn]}
            onPress={() => navigation.navigate('FaceGateAuth')}
          >
            <Text style={theme.styles.buttonText}>Start Face Scan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[theme.styles.buttonOutline, styles.fullWidthBtn, { marginTop: 10 }]}
            onPress={() => navigation.navigate('FaceGateEnroll')}
          >
            <Text style={theme.styles.buttonOutlineText}>Enroll New User</Text>
          </TouchableOpacity>
        </View>

        {/* Card 2: Today's Status */}
        <View style={[theme.styles.card, styles.sectionCard]}>
          <Text style={styles.sectionTitle}>Today's Status</Text>
          {lastSuccessLog ? (
            <View style={styles.statusRow}>
              <View style={styles.statusIconSuccess}>
                <Text style={styles.checkIcon}>check_circle</Text>
              </View>
              <View style={styles.statusDetails}>
                <Text style={styles.statusName}>{lastSuccessLog.name}</Text>
                <Text style={styles.statusTime}>
                  Verified at {new Date(lastSuccessLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={[theme.styles.badge, styles.successBadge]}>
                <Text style={[theme.styles.badgeText, styles.successBadgeText]}>Verified</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyStatusText}>Not verified yet</Text>
          )}
        </View>

        {/* Card 3: My Overview */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>My Overview</Text>
            <Text style={styles.sectionTitleRight}>Today</Text>
          </View>
          <StatGrid
            verificationsCount={verificationsToday}
            failedCount={failedAttempts}
            lastVerified={lastVerifiedText}
            isOnline={isOnline}
          />
        </View>

        <TouchableOpacity 
          style={[theme.styles.buttonOutline, styles.syncLink]} 
          onPress={() => navigation.navigate('FaceGateSync')}
        >
          <Text style={theme.styles.buttonOutlineText}>View Sync Dashboard</Text>
        </TouchableOpacity>

        {/* Bottom Sync Footer */}
        <View style={styles.footer}>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? theme.colors.success : theme.colors.textMuted }]} />
          <Text style={styles.footerText}>
            {isOnline ? 'Online' : 'Offline Mode'} · Last synced: {lastSyncTime}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    marginTop: 10,
    marginBottom: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingRight: 12,
  },
  backArrowSymbol: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 24,
    color: theme.colors.primary,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBackground: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: theme.colors.neutralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  faceIconSymbol: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 28,
    color: theme.colors.primary,
  },
  actionTextWrapper: {
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  fullWidthBtn: {
    width: '100%',
  },
  sectionCard: {
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  sectionTitleRight: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIconSuccess: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkIcon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 20,
    color: theme.colors.success,
  },
  statusDetails: {
    flex: 1,
  },
  statusName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statusTime: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  successBadge: {
    backgroundColor: theme.colors.successBg,
  },
  successBadgeText: {
    color: theme.colors.success,
  },
  emptyStatusText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  syncLink: {
    width: '100%',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footerText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
