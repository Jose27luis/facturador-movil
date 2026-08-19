import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMonto } from '@/shared/format';
import { BadgeEstado } from '@/shared/ui/badge-estado';
import { Comprobante, tonoEstado } from '@/features/ventas/ventas.types';
import { useComprobantes } from '@/features/ventas/use-ventas';
import { useReimprimir } from '@/features/ventas/use-reimprimir';

type Filtro = 'todos' | 'boletas' | 'facturas' | 'notas';

const FILTROS: { id: Filtro; etiqueta: string }[] = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'boletas', etiqueta: 'Boletas' },
  { id: 'facturas', etiqueta: 'Facturas' },
  { id: 'notas', etiqueta: 'Notas' },
];

function tipoBadge(tipoId: string, c: Tema): { letra: string; bg: string; color: string } {
  if (tipoId === '01') {
    return { letra: 'F', bg: '#E7EEF4', color: '#2A5E86' };
  }
  if (tipoId === '07' || tipoId === '08') {
    return { letra: tipoId === '07' ? 'NC' : 'ND', bg: '#F3DDDD', color: c.danger };
  }
  if (tipoId === '80') {
    return { letra: 'NV', bg: '#E3EFE6', color: c.ok };
  }
  return { letra: 'B', bg: c.surfaceAlt, color: c.muted };
}

function coincideFiltro(tipoId: string, filtro: Filtro): boolean {
  if (filtro === 'todos') {
    return true;
  }
  if (filtro === 'boletas') {
    return tipoId === '03';
  }
  if (filtro === 'facturas') {
    return tipoId === '01';
  }
  return tipoId === '07' || tipoId === '08' || tipoId === '80';
}

export default function VentasScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useComprobantes();
  const [texto, setTexto] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const { reimprimir, impresoraActiva, enCurso, estaImprimiendo } = useReimprimir();

  async function alReimprimir(item: Comprobante) {
    if (enCurso !== null) {
      return;
    }
    try {
      await reimprimir(item.id, item.esNotaVenta);
    } catch (err) {
      Alert.alert('No se pudo imprimir', err instanceof Error ? err.message : 'Revisa la impresora.');
    }
  }

  const lista = useMemo(() => {
    const t = texto.trim().toLowerCase();
    return (data ?? []).filter(
      (v) =>
        coincideFiltro(v.tipoId, filtro) &&
        (t === '' || v.numero.toLowerCase().includes(t) || v.cliente.toLowerCase().includes(t)),
    );
  }, [data, texto, filtro]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Ventas</Text>
        <View style={styles.busqueda}>
          <Ionicons name="search" size={17} color={c.faint} />
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            accessibilityLabel="Buscar por número o cliente"
          />
        </View>
        <View style={styles.chips}>
          {FILTROS.map((f) => {
            const activo = filtro === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.chip, activo && styles.chipActivo]}
                onPress={() => setFiltro(f.id)}
              >
                <Text style={[styles.chipText, activo && styles.chipTextActivo]}>{f.etiqueta}</Text>
              </Pressable>
            );
          })}
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
          data={lista}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.brand} />
          }
          ListHeaderComponent={
            <>
              <Pressable style={styles.banner} onPress={() => router.push('/resumenes')}>
                <View style={styles.bannerIcono}>
                  <Ionicons name="cloud-upload-outline" size={19} color={c.accent} />
                </View>
                <View style={styles.bannerTexto}>
                  <Text style={styles.bannerTitulo}>Resúmenes a SUNAT</Text>
                  <Text style={styles.bannerSub}>Envía el resumen diario de boletas</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.accent} />
              </Pressable>
              <Pressable style={styles.banner} onPress={() => router.push('/guias')}>
                <View style={styles.bannerIcono}>
                  <Ionicons name="car-outline" size={19} color={c.accent} />
                </View>
                <View style={styles.bannerTexto}>
                  <Text style={styles.bannerTitulo}>Guías de remisión</Text>
                  <Text style={styles.bannerSub}>Consulta las guías emitidas y su estado</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.accent} />
              </Pressable>
            </>
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.estado}>
              <Text style={styles.estadoText}>Sin comprobantes.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Fila
              item={item}
              mostrarImprimir={impresoraActiva !== null}
              imprimiendo={estaImprimiendo(item.id, item.esNotaVenta)}
              onImprimir={() => void alReimprimir(item)}
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

function Fila({
  item,
  mostrarImprimir,
  imprimiendo,
  onImprimir,
  onPress,
}: {
  item: Comprobante;
  mostrarImprimir: boolean;
  imprimiendo: boolean;
  onImprimir: () => void;
  onPress: () => void;
}) {
  const c = useTema();
  const styles = useEstilos(crear);
  const badge = tipoBadge(item.tipoId, c);
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.badgeText, { color: badge.color }]}>{badge.letra}</Text>
      </View>
      <View style={styles.filaInfo}>
        <View style={styles.filaTop}>
          <Text style={styles.numero}>{item.numero}</Text>
          {item.pagoEtiqueta ? (
            <View style={styles.pago}>
              <Text style={styles.pagoText}>{item.pagoEtiqueta}</Text>
            </View>
          ) : null}
          {item.estado ? (
            <BadgeEstado tono={tonoEstado(item.estadoId)} etiqueta={item.estado} />
          ) : null}
        </View>
        <Text style={styles.cliente} numberOfLines={1}>
          {item.cliente || 'Sin cliente'}
        </Text>
      </View>
      <View style={styles.filaDer}>
        <Text style={styles.monto}>{fmtMonto(item.total, item.moneda)}</Text>
        <Text style={styles.fecha}>{item.fecha}</Text>
      </View>
      {mostrarImprimir ? (
        <Pressable
          style={styles.imprimir}
          onPress={onImprimir}
          disabled={imprimiendo}
          hitSlop={8}
          accessibilityLabel={`Reimprimir ${item.numero}`}
        >
          {imprimiendo ? (
            <ActivityIndicator size="small" color={c.brand} />
          ) : (
            <Ionicons name="print-outline" size={19} color={c.muted} />
          )}
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const crear = (c: Tema) =>
  StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6, gap: 11 },
  titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.6 },
  busqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: radios.md,
    paddingHorizontal: 13,
    height: 46,
  },
  input: { flex: 1, fontSize: 15, color: c.text },
  chips: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: c.surfaceAlt,
  },
  chipActivo: { backgroundColor: c.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: c.muted },
  chipTextActivo: { color: c.onBrand },
  estado: { paddingVertical: 60, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  lista: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  sep: { height: 10 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.accentSoft,
    borderWidth: 1,
    borderColor: c.accentBorder,
    borderRadius: 15,
    padding: 13,
    marginBottom: 14,
  },
  bannerIcono: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTexto: { flex: 1 },
  bannerTitulo: { fontSize: 13.5, fontWeight: '700', color: c.accentText },
  bannerSub: { fontSize: 12, color: '#8A6A2E', marginTop: 1 },
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
  badgeText: { fontSize: 14, fontWeight: '800' },
  filaInfo: { flex: 1, minWidth: 0 },
  filaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  numero: { fontFamily: c.mono, fontSize: 13, color: c.text },
  pago: { backgroundColor: '#EFE3F5', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  pagoText: { fontSize: 10, fontWeight: '700', color: '#7A2E86', textTransform: 'lowercase' },
  cliente: { fontSize: 13, color: '#6E665B', marginTop: 3 },
  filaDer: { alignItems: 'flex-end' },
  monto: { fontFamily: c.monoSemi, fontSize: 14, color: c.text },
  fecha: { fontSize: 11.5, color: c.faint, marginTop: 2 },
  imprimir: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
