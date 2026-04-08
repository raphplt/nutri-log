import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '@/constants/theme';

export default function GoalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quel est ton objectif ?</Text>
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
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
  },
});
