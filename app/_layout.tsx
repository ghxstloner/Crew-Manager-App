import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SessionProvider } from '../store/authStore';
import { CrewProvider } from '../store/crewStore';
import { NetworkProvider } from '../store/networkStore';
import NetworkBanner from '../components/network/NetworkBanner';
import * as SplashScreen from 'expo-splash-screen';
import { colors } from '../constants/colors';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <NetworkProvider>
      <SessionProvider>
        <CrewProvider>
          <View style={{ flex: 1, backgroundColor: colors.primary }}>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.light },
              }}
            >
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <NetworkBanner />
          </View>
        </CrewProvider>
      </SessionProvider>
    </NetworkProvider>
  );
}