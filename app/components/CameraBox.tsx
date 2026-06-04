import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, Platform } from 'react-native';
import { theme } from '../theme';
import { FaceOval } from './FaceOval';

interface CameraBoxProps {
  isFaceDetected?: boolean;
  isLoading?: boolean;
  placeholderText?: string;
  children?: React.ReactNode;
}

export function CameraBox({
  isFaceDetected = false,
  isLoading = false,
  placeholderText = 'Position your face here',
  children,
}: CameraBoxProps) {
  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.warn("Webcam access error / permission denied: ", err);
      });
    }

    return () => {
      // Stop webcam stream when component unmounts
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track: any) => track.stop());
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Viewfinder */}
      <View style={styles.cameraView}>
        {Platform.OS === 'web' ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)' // Mirror camera
            }}
          />
        ) : (
          <View style={styles.cameraBackground}>
            <Text style={styles.iconSymbol}>monochrome_photos</Text>
            <Text style={styles.cameraMutedText}>Offline Camera Feed</Text>
          </View>
        )}

        {/* Face Oval Overlay Guide */}
        <FaceOval isFaceDetected={isFaceDetected} />

        {/* Loading Spinner overlay */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        )}
        
        {children}
      </View>

      {/* Helper text below oval */}
      <Text style={styles.helperText}>{placeholderText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  cameraView: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    backgroundColor: theme.colors.divider,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.divider,
  },
  cameraBackground: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.neutralLight,
  },
  cameraMutedText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
  iconSymbol: {
    fontFamily: 'Material Symbols Outlined',
    fontSize: 48,
    color: theme.colors.neutralMuted,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginTop: 12,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.overlayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

