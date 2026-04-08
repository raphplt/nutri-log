import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize } from '@/constants/theme';

export default function AddScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter un repas</Text>
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
