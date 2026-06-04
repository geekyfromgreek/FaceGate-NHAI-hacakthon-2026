import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { theme } from '../theme';
import { SyncRow } from '../components/SyncRow';
import { fetchAllLogs } from '../utils/embeddingStore';
import { syncLogsToCloud, setSimulatedOnline, getNetworkStatus } from '../utils/syncManager';

interface SyncScreenProps {
  navigation: {
    goBack: () => void;
  };
}

export default function SyncScreen({ navigation }: SyncScreenProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'SYNCED'>('PENDING');
  const [isOnline, setIsOnline] = useState(false);
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState('');

  const loadLogs = async () => {
    const allLogs = await fetchAllLogs();
    setLogs(allLogs);
    const netStatus = await getNetworkStatus();
    setIsOnline(netStatus);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const pendingLogs = logs.filter((l) => l.synced === 0);
  const syncedLogs = logs.filter((l) => l.synced === 1);

  const displayedLogs = activeTab === 'PENDING' ? pendingLogs : syncedLogs;

  const toggleNetwork = async () => {
    const nextState = !isOnline;
    setSimulatedOnline(nextState);
    setIsOnline(nextState);
    setSyncSuccessMsg('');
  };

  const handleSyncNow = async () => {
    if (!isOnline || pendingLogs.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0.1);
    setSyncSuccessMsg('');

    // Simulate progress bar updates
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 0.9) {
          clearInterval(interval);
          return 0.9;
        }
        return prev + 0.2;
      });
    }, 200);

    const result = await syncLogsToCloud();

    clearInterval(interval);
    setSyncProgress(1.0);

    setTimeout(async () => {
      setIsSyncing(false);
      if (result.success) {
        setSyncSuccessMsg(result.message);
        await loadLogs();
      }
    }, 400);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrowSymbol}>arrow_back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Sync Records</Text>
        </View>

        {/* Network Toggle Simulator Row */}
        <View style={[theme.styles.card, styles.simulatorCard]}>
          <Text style={styles.simulatorLabel}>Connection Status (Simulator):</Text>
          <TouchableOpacity
            style={[
              theme.styles.badge,
              { backgroundColor: isOnline ? theme.colors.successBg : theme.colors.errorBg },
            ]}
            onPress={toggleNetwork}
          >
            <Text
              style={[
                theme.styles.badgeText,
                { color: isOnline ? theme.colors.success : theme.colors.error, fontSize: 13 },
              ]}
            >
              {isOnline ? 'ONLINE (Click to disconnect)' : 'OFFLINE (Click to connect)'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Toggle Row */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'PENDING' ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => setActiveTab('PENDING')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'PENDING' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Pending · {pendingLogs.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabPill,
              activeTab === 'SYNCED' ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => setActiveTab('SYNCED')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'SYNCED' ? styles.tabTextActive : styles.tabTextInactive,
              ]}
            >
              Synced · {syncedLogs.length}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Scrollable SyncRow list */}
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
          {displayedLogs.length > 0 ? (
            displayedLogs.map((log) => (
              <SyncRow
                key={log.id}
                name={log.name}
                status={log.status}
                timestamp={log.timestamp}
                synced={log.synced === 1}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>folder_open</Text>
              <Text style={styles.emptyText}>No records found</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Fixed Action Area */}
        <View style={styles.bottomContainer}>
          {syncSuccessMsg ? (
            <View style={styles.successMessageRow}>
              <Text style={styles.successBadgeIcon}>check_circle</Text>
              <Text style={styles.successMessageText}>{syncSuccessMsg}</Text>
            </View>
          ) : null}

          {isSyncing && (
            <View style={styles.progressWrapper}>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${syncProgress * 100}%` }]} />
              </View>
              <Text style={styles.progressLabel}>Uploading logs to AWS...</Text>
            </View>
          )}

          {!isOnline ? (
            <View style={styles.offlineActionWrapper}>
              <TouchableOpacity
                style={[theme.styles.button, styles.disabledButton]}
                disabled={true}
              >
                <Text style={theme.styles.buttonText}>Sync Now</Text>
              </TouchableOpacity>
              <Text style={styles.actionSubtext}>Connect to network to sync</Text>
            </View>
          ) : (
            <View style={styles.onlineActionWrapper}>
              <TouchableOpacity
                style={[
                  theme.styles.button,
                  styles.syncBtn,
                  pendingLogs.length === 0 && styles.disabledButton,
                ]}
                onPress={handleSyncNow}
                disabled={isSyncing || pendingLogs.length === 0}
              >
                {isSyncing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={theme.styles.buttonText}>Sync Now</Text>
                )}
              </TouchableOpacity>
              {pendingLogs.length > 0 ? (
                <Text style={styles.actionSubtext}>
                  Ready to sync {pendingLogs.length} pending logs
                </Text>
              ) : (
                <Text style={styles.actionSubtext}>All records successfully synced</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  simulatorCard: {
    marginHorizontal: 20,
    marginTop: 6,
    marginBottom: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simulatorLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.divider,
    borderRadius: 24,
    padding: 4,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  tabPill: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: theme.colors.primary,
  },
  tabInactive: {
    backgroundColor: theme.colors.transparent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: theme.colors.card,
  },
  tabTextInactive: {
    color: theme.colors.textMuted,
  },
  listContainer: {
    flex: 1,
    backgroundColor: theme.colors.card,
    marginHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    marginBottom: 12,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 48,
    color: theme.colors.inputBorder,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: theme.colors.card,
    borderTopWidth: 1,
    borderColor: theme.colors.divider,
  },
  successMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.successBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  successBadgeIcon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 18,
    color: theme.colors.success,
  },
  successMessageText: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '500',
  },
  progressWrapper: {
    marginBottom: 12,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: theme.colors.divider,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  progressLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 6,
    textAlign: 'center',
  },
  offlineActionWrapper: {
    alignItems: 'center',
  },
  onlineActionWrapper: {
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: theme.colors.disabled,
    opacity: 0.6,
    width: '100%',
  },
  syncBtn: {
    width: '100%',
  },
  actionSubtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
});
