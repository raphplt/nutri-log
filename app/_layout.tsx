import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { db } from '@/db/client';
import migrations from '@/drizzle/migrations';
import { colors, fonts } from '@/constants/theme';
import 'react-native-reanimated';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (success && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [success, fontsLoaded]);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Database error: {error.message}</Text>
      </View>
    );
  }

  if (!success || !fontsLoaded) {
    return null; // splash screen visible
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: fonts.semibold },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="add" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="meal/[id]" options={{ title: 'Repas' }} />
      <Stack.Screen name="weight" options={{ title: 'Poids' }} />
      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  error: {
    color: colors.danger,
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});
