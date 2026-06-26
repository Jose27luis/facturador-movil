import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletaClara, radios } from '@/core/theme/tokens';
import { fmtMonto } from '@/shared/format';
import { BadgeEstado } from '@/shared/ui/badge-estado';
import { tonoEstado } from '@/features/ventas/ventas.types';
import { useComprobante } from '@/features/ventas/use-ventas';

const c = paletaClara;

export default function ComprobanteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: comprobante, isLoading } = useComprobante(Number(id));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.volver} onPress={() => router.back()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Comprobante</Text>
        <View style={styles.volver} />
      </View>

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : !comprobante ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se encontró el comprobante.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <Text style={styles.tipo}>{comprobante.tipo}</Text>
            <Text style={styles.numero}>{comprobante.numero}</Text>
            <Text style={styles.total}>{fmtMonto(comprobante.total, comprobante.moneda)}</Text>
            <BadgeEstado tono={tonoEstado(comprobante.estadoId)} etiqueta={comprobante.estado} />
          </View>

          <View style={styles.card}>
            <Dato etiqueta="Cliente" valor={comprobante.cliente || '—'} />
            <Dato etiqueta="Documento" valor={comprobante.clienteDoc || '—'} />
            <Dato etiqueta="Fecha de emisión" valor={comprobante.fecha} />
            <Dato etiqueta="Moneda" valor={comprobante.moneda} ultimo />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Dato({ etiqueta, valor, ultimo }: { etiqueta: string; valor: string; ultimo?: boolean }) {
  return (
    <View style={[styles.dato, ultimo && styles.datoUltimo]}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  volver: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
  estado: { paddingVertical: 60, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  content: { padding: 20, gap: 16 },
  hero: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    gap: 6,
    alignItems: 'flex-start',
  },
  tipo: { fontSize: 13, color: c.muted, fontWeight: '600' },
  numero: { fontSize: 20, fontWeight: '800', color: c.text },
  total: { fontSize: 30, fontWeight: '800', color: c.text, marginVertical: 4, letterSpacing: -0.5 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 16,
  },
  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  datoUltimo: { borderBottomWidth: 0 },
  datoEtiqueta: { fontSize: 14, color: c.muted },
  datoValor: { fontSize: 14, fontWeight: '600', color: c.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
});
