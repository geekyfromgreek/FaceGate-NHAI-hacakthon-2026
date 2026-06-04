import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { LivenessChallenge } from '../utils/livenessCheck';

interface LivenessPromptProps {
  challenge: LivenessChallenge;
}

export function LivenessPrompt({ challenge }: LivenessPromptProps) {
  const getChallengeDetails = () => {
    switch (challenge) {
      case 'BLINK':
        return {
          icon: 'visibility',
          title: 'Please blink to continue',
        };
      case 'SMILE':
        return {
          icon: 'mood',
          title: 'Please smile to continue',
        };
      case 'HEAD_TURN':
        return {
          icon: 'arrow_forward',
          title: 'Turn your head slightly',
        };
      default:
        return {
          icon: 'help_outline',
          title: 'Perform challenge',
        };
    }
  };

  const details = getChallengeDetails();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{details.icon}</Text>
      </View>
      <Text style={styles.title}>{details.title}</Text>
      <Text style={styles.subtext}>Anti-spoofing check</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.neutralLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 24,
    color: theme.colors.accent,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  subtext: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});
