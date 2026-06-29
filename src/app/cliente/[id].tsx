import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMoneda, fmtMonto } from '@/shared/format';
import { volver } from '@/shared/navegar';
import { CompraHistorial } from '@/features/clientes/clientes.types';
import { useHistorialCliente } from '@/features/clientes/use-clientes';

function fechaLegible(iso: string): string {
  if (!iso) {
    return '—';
  }
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function badgeTipo(tipoId: string): { letra: string; bg: string; color: string } {
  if (tipoId === '01') {
    return { letra: 'F', bg: '#E7EEF4', color: '#2A5E86' };
  }
  if (tipoId === '07') {
    return { letra: 'NC', bg: '#F3DDDD', color: '#B23B3B' };
  }
  if (tipoId === '08') {
    return { letra: 'ND', bg: '#F3DDDD', color: '#B23B3B' };
  }
  if (tipoId === '80') {
    return { letra: 'NV', bg: '#E3EFE6', color: '#3C7A4E' };
  }
  return { letra: 'B', bg: '#EFE9DD', color: '#7A7163' };
}

export default function ClienteScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; nombre?: string }>();
  const idNum = Number(params.id);
  const { data, isLoading, isError, refetch, isRefetching } = useHistorialCliente(idNum);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo} numberOfLines={1}>
          {params.nombre || 'Cliente'}
        </Text>
        <View style={styles.iconoBtn} />
      </View>

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : isError || !data ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se pudo cargar el cliente.</Text>
        </View>
      ) : (
        <FlatList
          data={data.historial}
          keyExtractor={(item) => `${item.esNotaVenta ? 'nv' : 'doc'}-${item.id}`}
          contentContainerStyle={styles.lista}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ListHeaderComponent={
            <View style={styles.cabecera}>
              <View style={styles.tarjeta}>
                <Text style={styles.nombre}>{data.cliente.nombre || 'Sin nombre'}</Text>
                <Text style={styles.documento}>
                  {data.cliente.tipoDocumento} {data.cliente.numero}
                </Text>
                {data.cliente.direccion ? (
                  <Text style={styles.dato}>{data.cliente.direccion}</Text>
                ) : null}
                {data.cliente.telefono ? (
                  <Text style={styles.dato}>Tel. {data.cliente.telefono}</Text>
                ) : null}
                {data.cliente.email ? <Text style={styles.dato}>{data.cliente.email}</Text> : null}
              </View>

              <View style={styles.resumen}>
                <View style={styles.kpi}>
                  <Text style={styles.kpiValor}>{fmtMoneda(data.totalComprado)}</Text>
                  <Text style={styles.kpiLabel}>Total comprado</Text>
                </View>
                <View style={styles.kpi}>
                  <Text style={styles.kpiValor}>{data.comprobantes}</Text>
                  <Text style={styles.kpiLabel}>Comprobantes</Text>
                </View>
              </View>

              <Text style={styles.seccion}>Historial</Text>
            </View>
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.estado}>
              <Text style={styles.estadoText}>Este cliente aún no tiene compras.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Fila
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/comprobante/[id]',
                  params: { id: String(item.id), nv: item.esNotaVenta ? '1' : '0' },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item, onPress }: { item: CompraHistorial; onPress: () => void }) {
  const c = useTema();
  const styles = useEstilos(crear);
  const badge = badgeTipo(item.tipoId);
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.letra}</Text>
      </View>
      <View style={styles.filaInfo}>
        <Text style={styles.filaNumero}>{item.numero}</Text>
        <Text style={styles.filaFecha}>{fechaLegible(item.fecha)}</Text>
      </View>
      <Text style={styles.filaTotal}>{fmtMonto(item.total, item.moneda)}</Text>
    </Pressable>
  );
}

const crear = (c: Tema) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    iconoBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitulo: { flex: 1, fontSize: 16, fontWeight: '700', color: c.text, textAlign: 'center' },
    estado: { paddingVertical: 60, alignItems: 'center', gap: 10 },
    estadoText: { color: c.muted, fontSize: 14 },
    lista: { padding: 20 },
    cabecera: { gap: 14, marginBottom: 4 },
    tarjeta: {
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 4,
    },
    nombre: { fontSize: 17, fontWeight: '800', color: c.text },
    documento: { fontFamily: c.mono, fontSize: 13.5, color: c.muted, marginBottom: 4 },
    dato: { fontSize: 13, color: c.muted, lineHeight: 18 },
    resumen: { flexDirection: 'row', gap: 12 },
    kpi: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      alignItems: 'center',
    },
    kpiValor: { fontFamily: c.monoSemi, fontSize: 20, color: c.text },
    kpiLabel: { fontSize: 11.5, color: c.muted, fontWeight: '600', marginTop: 3 },
    seccion: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 4,
    },
    sep: { height: 10 },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 13,
      backgroundColor: c.surface,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: c.border,
      padding: 13,
    },
    badge: { width: 40, height: 40, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 13, fontWeight: '800' },
    filaInfo: { flex: 1, minWidth: 0 },
    filaNumero: { fontFamily: c.mono, fontSize: 13, color: c.text },
    filaFecha: { fontSize: 12, color: c.faint, marginTop: 3 },
    filaTotal: { fontFamily: c.monoSemi, fontSize: 14, color: c.text },
  });
