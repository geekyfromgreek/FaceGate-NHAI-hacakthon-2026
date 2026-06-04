import React, { useState } from 'react';
import HomeScreen from './app/screens/HomeScreen';
import EnrollScreen from './app/screens/EnrollScreen';
import AuthScreen from './app/screens/AuthScreen';
import SyncScreen from './app/screens/SyncScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('FaceGateHome');

  const navigate = (screen: string) => {
    setCurrentScreen(screen);
  };

  const goBack = () => {
    // Simple back logic routing back to HomeScreen
    setCurrentScreen('FaceGateHome');
  };

  const navigation = { navigate, goBack };

  switch (currentScreen) {
    case 'FaceGateHome':
      return <HomeScreen navigation={navigation} />;
    case 'FaceGateEnroll':
      return <EnrollScreen navigation={navigation} />;
    case 'FaceGateAuth':
      return <AuthScreen navigation={navigation} />;
    case 'FaceGateSync':
      return <SyncScreen navigation={navigation} />;
    default:
      return <HomeScreen navigation={navigation} />;
  }
}
