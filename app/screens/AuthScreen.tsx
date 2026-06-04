import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { theme } from '../theme';
import { CameraBox } from '../components/CameraBox';
import { LivenessPrompt } from '../components/LivenessPrompt';
import { StatusCard } from '../components/StatusCard';
import { getRandomChallenge, LivenessChallenge } from '../utils/livenessCheck';
import { matchFace, logAuthAttempt, fetchAllUsers } from '../utils/embeddingStore';

interface AuthScreenProps {
  navigation: {
    goBack: () => void;
  };
}

type AuthStep = 'DETECTION' | 'LIVENESS' | 'PROCESSING' | 'RESULT';

export default function AuthScreen({ navigation }: AuthScreenProps) {
  const [activeStep, setActiveStep] = useState<AuthStep>('DETECTION');
  const [challenge, setChallenge] = useState<LivenessChallenge>('BLINK');
  
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [authStatus, setAuthStatus] = useState<'SUCCESS' | 'FAILURE'>('SUCCESS');
  const [verifiedName, setVerifiedName] = useState('');
  const [verifiedTime, setVerifiedTime] = useState('');

  useEffect(() => {
    startAuthSession();
  }, []);

  const startAuthSession = () => {
    setActiveStep('DETECTION');
    setIsFaceDetected(false);
    
    // Choose a random challenge to prevent replay attacks
    const newChallenge = getRandomChallenge();
    setChallenge(newChallenge);
    
    // Step 1: Simulate Face Detection after 1.2s
    setTimeout(() => {
      setIsFaceDetected(true);
      setActiveStep('LIVENESS');
    }, 1200);
  };

  const handleLivenessSuccess = () => {
    // Step 2: Liveness passed, transition to ONNX Matching
    setActiveStep('PROCESSING');
    
    // Simulate inference time (ONNX model runs under 600ms)
    setTimeout(async () => {
      // Fetch enrolled users to dynamically verify the newly enrolled user if desired
      const users = await fetchAllUsers();
      const shouldSucceed = Math.random() > 0.15 && users.length > 0;
      
      let embedding: number[];
      if (shouldSucceed) {
        // Retrieve the most recently enrolled user's embedding
        const targetUser = users[users.length - 1];
        const targetVector: number[] = JSON.parse(targetUser.embedding);
        
        // Add tiny variation noise (simulating real-world camera variation)
        embedding = targetVector.map(val => val + (Math.random() * 0.02 - 0.01));
      } else {
        // Random vector that won't match any enrolled user
        embedding = new Array(128).fill(0).map(() => Math.random() * 2 - 1);
      }

      const matchResult = await matchFace(embedding);
      const timestamp = new Date().toISOString();
      const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      if (matchResult.success && matchResult.user) {
        setAuthStatus('SUCCESS');
        setVerifiedName(matchResult.user.name);
        setVerifiedTime(timeString);
        await logAuthAttempt(matchResult.user.user_id, matchResult.user.name, 'SUCCESS');
      } else {
        setAuthStatus('FAILURE');
        await logAuthAttempt('UNKNOWN', 'Unrecognized User', 'FAILURE');
      }
      
      setActiveStep('RESULT');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrowSymbol}>arrow_back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Face Scan</Text>
        </View>

        {/* Card 1: Camera viewfinder & Oval overlay */}
        <View style={theme.styles.card}>
          <CameraBox
            isFaceDetected={isFaceDetected}
            isLoading={activeStep === 'PROCESSING'}
            placeholderText={
              activeStep === 'DETECTION'
                ? 'Align your face in the oval guide'
                : 'Liveness challenge active'
            }
          />
        </View>

        {/* Liveness Challenge prompt card */}
        {activeStep === 'LIVENESS' && (
          <View style={theme.styles.card}>
            <LivenessPrompt challenge={challenge} />
            
            {/* Interactive triggers representing landmark triggers for simulator */}
            <TouchableOpacity
              style={[theme.styles.button, styles.triggerBtn]}
              onPress={handleLivenessSuccess}
            >
              <Text style={theme.styles.buttonText}>Simulate Action Check</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing State */}
        {activeStep === 'PROCESSING' && (
          <View style={[theme.styles.card, styles.processingCard]}>
            <ActivityIndicator size="small" color={theme.colors.accent} style={styles.spinner} />
            <Text style={styles.processingText}>Matching face...</Text>
          </View>
        )}

        {/* Authentication Result Cards */}
        {activeStep === 'RESULT' && (
          <StatusCard
            status={authStatus}
            name={verifiedName}
            timestamp={verifiedTime}
            onRetry={startAuthSession}
          />
        )}
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
  triggerBtn: {
    marginTop: 10,
    width: '100%',
  },
  processingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
  },
  spinner: {
    marginRight: 4,
  },
  processingText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
});
