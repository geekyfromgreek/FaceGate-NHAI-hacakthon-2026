import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../theme';

interface FaceOvalProps {
  isFaceDetected?: boolean;
}

export function FaceOval({ isFaceDetected = false }: FaceOvalProps) {
  return (
    <View style={styles.overlayContainer}>
      <View
        style={[
          styles.oval,
          {
            borderColor: isFaceDetected ? theme.colors.accent : theme.colors.primary,
          },
        ]}
      />
    </View>
  );
}

const { width } = Dimensions.get('window');
const ovalWidth = width * 0.65;
const ovalHeight = ovalWidth * 1.35;

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  oval: {
    width: ovalWidth,
    height: ovalHeight,
    borderRadius: ovalWidth / 2,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
});
