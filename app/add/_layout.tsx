import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

export default function AddLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ajouter' }} />
      <Stack.Screen name="scan" options={{ title: 'Scanner', headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Rechercher' }} />
      <Stack.Screen name="quick" options={{ title: 'Ajout rapide' }} />
      <Stack.Screen name="confirm" options={{ title: 'Confirmer' }} />
    </Stack>
  );
}
