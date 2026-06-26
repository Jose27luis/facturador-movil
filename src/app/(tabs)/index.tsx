import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSession } from '@/core/auth/session';
import { fuentes, paletaClara, radios } from '@/core/theme/tokens';
import { fmtMoneda } from '@/shared/format';
import { BarraDia } from '@/features/dashboard/dashboard.types';
import { useDashboard } from '@/features/dashboard/use-dashboard';

const c = paletaClara;

export default function InicioScreen() {
  const router = useRouter();
  const usuario = useSession((s) => s.usuario);
  const cerrar = useSession((s) => s.cerrar);
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();

  const iniciales = (usuario?.nombre || 'MF')
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.top}>
        <View>
          <Text style={styles.hola}>Hola, {usuario?.nombre || 'tu empresa'}</Text>
          <Text style={styles.titulo}>Resumen</Text>
        </View>
        <Pressable style={styles.avatar} onPress={() => void cerrar()}>
          <Text style={styles.avatarText}>{iniciales}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.brand} />
        }
      >
        {isLoading ? (
          <View style={styles.estado}>
            <ActivityIndicator color={c.brand} />
          </View>
        ) : isError ? (
          <View style={styles.estado}>
            <Text style={styles.estadoText}>No se pudo cargar el resumen.</Text>
          </View>
        ) : (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Vendido · Este mes</Text>
              <Text style={styles.heroMonto}>{fmtMoneda(data?.vendido ?? 0)}</Text>
            </View>

            <View style={styles.fila}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Comprobantes</Text>
                <Text style={styles.kpiValor}>{fmtMoneda(data?.comprobantes ?? 0)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Notas de venta</Text>
                <Text style={styles.kpiValor}>{fmtMoneda(data?.notasVenta ?? 0)}</Text>
              </View>
            </View>

            <Grafico barras={data?.barras ?? []} />
          </>
        )}

        <Text style={styles.seccion}>Accesos rápidos</Text>
        <View style={styles.accesos}>
          <Acceso icono="add" texto="Nueva venta" onPress={() => router.push('/emitir')} />
          <Acceso
            icono="cart-outline"
            texto="Compras"
            onPress={() => router.push('/(tabs)/compras')}
          />
          <Acceso
            icono="cube-outline"
            texto="Productos"
            onPress={() => router.push('/(tabs)/productos')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Grafico({ barras }: { barras: BarraDia[] }) {
  const max = Math.max(1, ...barras.map((b) => b.valor));
  const conValor = barras.filter((b) => b.valor > 0).length;
  return (
    <View style={styles.grafico}>
      <View style={styles.graficoHead}>
        <Text style={styles.graficoTitulo}>Ventas por día</Text>
        <Text style={styles.graficoSub}>Este mes</Text>
      </View>
      {conValor === 0 ? (
        <Text style={styles.graficoVacio}>Sin ventas registradas este mes.</Text>
      ) : (
        <View style={styles.barras}>
          {barras.map((b, i) => (
            <View key={i} style={styles.barraCol}>
              <View style={styles.barraTrack}>
                <View
                  style={[
                    styles.barraFill,
                    { height: `${Math.max(2, (b.valor / max) * 100)}%`, opacity: b.valor > 0 ? 1 : 0.25 },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Acceso({
  icono,
  texto,
  onPress,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.acceso} onPress={onPress}>
      <Ionicons name={icono} size={22} color={c.text} />
      <Text style={styles.accesoText}>{texto}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  top: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  hola: { fontSize: 13, color: c.muted, fontWeight: '600' },
  titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.6, marginTop: 2 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: c.onBrand, fontWeight: '700', fontSize: 15 },
  content: { padding: 20, gap: 12 },
  estado: { paddingVertical: 40, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  hero: { backgroundColor: c.brand, borderRadius: radios.xl, padding: 20 },
  heroLabel: {
    fontSize: 12.5,
    color: '#B8AF9C',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroMonto: {
    fontFamily: fuentes.monoSemi,
    fontSize: 34,
    color: c.onBrand,
    letterSpacing: -1,
    marginTop: 8,
  },
  fila: { flexDirection: 'row', gap: 12 },
  kpi: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
  },
  kpiLabel: {
    fontSize: 11.5,
    color: c.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiValor: { fontFamily: fuentes.monoSemi, fontSize: 18, color: c.text, marginTop: 6 },
  grafico: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
  },
  graficoHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  graficoTitulo: { fontSize: 14.5, fontWeight: '700', color: c.text },
  graficoSub: { fontSize: 12, color: c.muted },
  graficoVacio: { fontSize: 13, color: c.faint, paddingVertical: 20, textAlign: 'center' },
  barras: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 3 },
  barraCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  barraTrack: { height: '100%', justifyContent: 'flex-end' },
  barraFill: { width: '100%', backgroundColor: c.brand, borderRadius: 3, minHeight: 2 },
  seccion: {
    fontSize: 13,
    fontWeight: '700',
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 8,
  },
  accesos: { flexDirection: 'row', gap: 10 },
  acceso: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 15,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  accesoText: { fontSize: 12, fontWeight: '600', color: c.text },
});
