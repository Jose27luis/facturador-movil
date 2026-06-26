import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletaClara, radios } from '@/core/theme/tokens';
import { fmtMonto } from '@/shared/format';
import { BadgeEstado } from '@/shared/ui/badge-estado';
import { Comprobante, tonoEstado } from '@/features/ventas/ventas.types';
import { useComprobantes } from '@/features/ventas/use-ventas';

const c = paletaClara;

export default function VentasScreen() {
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useComprobantes();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Ventas</Text>
        <View style={styles.acciones}>
          <Pressable
            style={styles.resumenes}
            onPress={() => router.push('/resumenes')}
            accessibilityLabel="Resúmenes a SUNAT"
          >
            <Ionicons name="cloud-upload-outline" size={20} color={c.brand} />
          </Pressable>
          <Pressable style={styles.emitir} onPress={() => router.push('/emitir')}>
            <Ionicons name="add" size={20} color={c.onBrand} />
            <Text style={styles.emitirText}>Emitir</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : isError ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se pudieron cargar los comprobantes.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.brand} />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.estado}>
              <Text style={styles.estadoText}>Aún no hay comprobantes.</Text>
            </View>
          }
          renderItem={({ item }) => <Fila item={item} onPress={() => router.push(`/comprobante/${item.id}`)} />}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item, onPress }: { item: Comprobante; onPress: () => void }) {
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <View style={styles.filaTop}>
        <Text style={styles.numero}>{item.numero}</Text>
        <Text style={styles.monto}>{fmtMonto(item.total, item.moneda)}</Text>
      </View>
      <Text style={styles.cliente} numberOfLines={1}>
        {item.cliente || 'Sin cliente'}
      </Text>
      <View style={styles.filaBottom}>
        <Text style={styles.fecha}>
          {item.tipo} · {item.fecha}
        </Text>
        <BadgeEstado tono={tonoEstado(item.estadoId)} etiqueta={item.estado} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.4 },
  acciones: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resumenes: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emitir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  emitirText: { color: c.onBrand, fontWeight: '700', fontSize: 14 },
  estado: { paddingVertical: 60, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  lista: { paddingHorizontal: 20, paddingBottom: 24 },
  sep: { height: 10 },
  fila: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    gap: 8,
  },
  filaTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: 15, fontWeight: '800', color: c.text },
  monto: { fontSize: 15, fontWeight: '800', color: c.text },
  cliente: { fontSize: 14, color: c.muted },
  filaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontSize: 12, color: c.faint },
});
