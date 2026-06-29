import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';

interface RutaTab {
  key: string;
  name: string;
}

interface BarraProps {
  state: { index: number; routes: RutaTab[] };
}

const meta: Record<string, { icono: keyof typeof Ionicons.glyphMap; titulo: string; ruta: string }> = {
  index: { icono: 'home-outline', titulo: 'Inicio', ruta: '/(tabs)' },
  ventas: { icono: 'receipt-outline', titulo: 'Ventas', ruta: '/(tabs)/ventas' },
  compras: { icono: 'cart-outline', titulo: 'Compras', ruta: '/(tabs)/compras' },
  productos: { icono: 'cube-outline', titulo: 'Productos', ruta: '/(tabs)/productos' },
  caja: { icono: 'cash-outline', titulo: 'Caja', ruta: '/(tabs)/caja' },
};

function BarraTabs({ state }: BarraProps) {
  const router = useRouter();
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const rutas = state.routes;

  function boton(ruta: RutaTab, index: number) {
    const activo = state.index === index;
    const color = activo ? c.brand : c.faint;
    const info = meta[ruta.name];
    return (
      <Pressable key={ruta.key} style={styles.tab} onPress={() => router.navigate(info.ruta as never)}>
        <Ionicons name={info?.icono ?? 'ellipse-outline'} size={23} color={color} />
        <Text style={[styles.tabText, { color }]}>{info?.titulo ?? ruta.name}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.barra, { paddingBottom: insets.bottom + 9 }]}>
      {rutas.slice(0, 2).map((r, i) => boton(r, i))}
      <View style={styles.centro}>
        <Pressable style={styles.fab} onPress={() => router.push('/emitir')} accessibilityLabel="Nueva venta">
          <Ionicons name="add" size={26} color={c.onBrand} />
        </Pressable>
      </View>
      {rutas.slice(2).map((r, i) => boton(r, i + 2))}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <BarraTabs state={props.state} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="ventas" />
      <Tabs.Screen name="compras" />
      <Tabs.Screen name="productos" />
      <Tabs.Screen name="caja" />
    </Tabs>
  );
}

const crear = (c: Tema) =>
  StyleSheet.create({
    barra: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: c.tabBar,
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 9,
      paddingHorizontal: 8,
    },
    tab: { flex: 1, alignItems: 'center', gap: 3 },
    tabText: { fontSize: 10.5, fontWeight: '600', fontFamily: c.sans },
    centro: { flex: 1, alignItems: 'center' },
    fab: {
      width: 54,
      height: 54,
      borderRadius: 18,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -22,
      shadowColor: '#211D17',
      shadowOpacity: 0.3,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
      elevation: 6,
    },
  });
