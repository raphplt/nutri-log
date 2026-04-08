import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '@/db/client';
import { userProfile } from '@/db/schema';
import { colors, fontSize, spacing } from '@/constants/theme';

export default function DashboardScreen() {
  const { data: profiles } = useLiveQuery(db.select().from(userProfile));

  if (profiles.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>NutriLog est prêt</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
});
