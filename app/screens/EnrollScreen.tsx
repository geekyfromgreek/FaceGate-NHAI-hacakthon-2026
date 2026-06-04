import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../theme';
import { CameraBox } from '../components/CameraBox';
import { enrollUser } from '../utils/embeddingStore';

interface EnrollScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function EnrollScreen({ navigation }: EnrollScreenProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [capturedCount, setCapturedCount] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Store temporary mock embeddings captured
  const [tempEmbeddings, setTempEmbeddings] = useState<number[][]>([]);

  const handleCapture = async () => {
    if (!employeeId.trim() || !fullName.trim()) {
      setErrorMsg('Please enter both Employee ID and Full Name.');
      return;
    }
    setErrorMsg('');
    setIsCapturing(true);

    // Mock capturing a frame
    setTimeout(() => {
      const mockVector = new Array(128).fill(0).map(() => Math.random() * 2 - 1);
      const newEmbeddings = [...tempEmbeddings, mockVector];
      setTempEmbeddings(newEmbeddings);
      
      const newCount = capturedCount + 1;
      setCapturedCount(newCount);
      setIsCapturing(false);

      if (newCount === 3) {
        // Run enrollment logic once 3 frames are captured
        saveEnrollment(newEmbeddings);
      }
    }, 800);
  };

  const saveEnrollment = async (embeddingsToSave: number[][]) => {
    setIsCapturing(true);
    try {
      await enrollUser(employeeId, fullName, embeddingsToSave);
      setIsEnrolled(true);
    } catch (err) {
      setErrorMsg('Failed to save enrollment. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetForm = () => {
    setEmployeeId('');
    setFullName('');
    setCapturedCount(0);
    setTempEmbeddings([]);
    setIsEnrolled(false);
    setErrorMsg('');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backArrowSymbol}>arrow_back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Enroll User</Text>
        </View>

        {!isEnrolled ? (
          <>
            {/* Card 1: Camera box */}
            <View style={theme.styles.card}>
              <CameraBox
                isFaceDetected={capturedCount > 0 || isCapturing}
                isLoading={isCapturing}
                placeholderText="Position your face here"
              />
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{capturedCount} / 3 frames captured</Text>
              <View style={styles.dotsRow}>
                {[1, 2, 3].map((step) => (
                  <View
                    key={step}
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          capturedCount >= step ? theme.colors.primary : theme.colors.inputBorder,
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Card 2: Enrollment Form */}
            <View style={theme.styles.card}>
              <Text style={styles.label}>Employee ID</Text>
              <TextInput
                style={theme.styles.input}
                placeholder="e.g. NHAI-2026-88"
                value={employeeId}
                onChangeText={setEmployeeId}
                autoCapitalize="characters"
              />

              <Text style={[styles.label, { marginTop: 14 }]}>Full Name</Text>
              <TextInput
                style={theme.styles.input}
                placeholder="e.g. Rajesh Kumar"
                value={fullName}
                onChangeText={setFullName}
              />

              {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            </View>

            {/* Action button */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[theme.styles.button, styles.fullWidthBtn]}
                onPress={handleCapture}
                disabled={isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={theme.styles.buttonText}>Capture & Enroll</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.subtext}>3 frames will be averaged for accuracy</Text>
            </View>
          </>
        ) : (
          /* Inline Success State */
          <View style={[theme.styles.card, styles.successCard]}>
            <View style={styles.successIconWrapper}>
              <Text style={styles.successCheckSymbol}>check_circle</Text>
            </View>
            <Text style={styles.successTitle}>Enrolled Successfully</Text>
            
            <View style={styles.successDetails}>
              <Text style={styles.detailText}>
                <Text style={styles.boldLabel}>Name: </Text>
                {fullName}
              </Text>
              <Text style={styles.detailText}>
                <Text style={styles.boldLabel}>Employee ID: </Text>
                {employeeId}
              </Text>
            </View>

            <TouchableOpacity
              style={[theme.styles.button, styles.fullWidthBtn, { marginTop: 24 }]}
              onPress={resetForm}
            >
              <Text style={theme.styles.buttonText}>Enroll Another</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[theme.styles.buttonOutline, styles.fullWidthBtn, { marginTop: 12 }]}
              onPress={() => navigation.navigate('FaceGateAuth')}
            >
              <Text style={theme.styles.buttonOutlineText}>Go to Authenticate</Text>
            </TouchableOpacity>
          </View>
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
  progressContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  actionContainer: {
    marginTop: 4,
    alignItems: 'center',
  },
  fullWidthBtn: {
    width: '100%',
  },
  subtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
  },
  successCard: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
  },
  successIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successCheckSymbol: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 40,
    color: theme.colors.success,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  successDetails: {
    backgroundColor: theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: theme.colors.divider,
    borderRadius: 10,
    padding: 16,
    width: '100%',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  boldLabel: {
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
