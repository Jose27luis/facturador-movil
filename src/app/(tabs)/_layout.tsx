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
  productos: { icono: 'cube-outline', titulo: 'Productos', ruta: '/(tabs)/productos' },
  caja: { icono: 'cash-outline', titulo: 'Caja', ruta: '/(tabs)/caja' },
};

const VISIBLES = ['index', 'ventas', 'productos', 'caja'];

function BarraTabs({ state }: BarraProps) {
  const router = useRouter();
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const activa = state.routes[state.index]?.name;

  function boton(nombre: string) {
    const info = meta[nombre];
    const color = activa === nombre ? c.brand : c.faint;
    return (
      <Pressable key={nombre} style={styles.tab} onPress={() => router.navigate(info.ruta as never)}>
        <Ionicons name={info.icono} size={23} color={color} />
        <Text style={[styles.tabText, { color }]}>{info.titulo}</Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.barra, { paddingBottom: insets.bottom + 9 }]}>
      {VISIBLES.slice(0, 2).map(boton)}
      <View style={styles.centro}>
        <Pressable style={styles.fab} onPress={() => router.push('/emitir')} accessibilityLabel="Nueva venta">
          <Ionicons name="add" size={26} color={c.onBrand} />
        </Pressable>
      </View>
      {VISIBLES.slice(2).map(boton)}
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
