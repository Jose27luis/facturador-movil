import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { paletaClara } from '@/core/theme/tokens';

export default function IndexScreen() {
  return (
    <View style={styles.root}>
      <ActivityIndicator color={paletaClara.brand} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: paletaClara.bg,
  },
});
