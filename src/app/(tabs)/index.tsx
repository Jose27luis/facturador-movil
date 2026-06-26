import { useState } from 'react';
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
import { paletaClara, radios } from '@/core/theme/tokens';
import { fmtMoneda, fmtNumero } from '@/shared/format';
import { PERIODOS, Periodo } from '@/features/dashboard/dashboard.types';
import { useDashboard } from '@/features/dashboard/use-dashboard';

const c = paletaClara;

export default function InicioScreen() {
  const usuario = useSession((s) => s.usuario);
  const cerrar = useSession((s) => s.cerrar);
  const [periodo, setPeriodo] = useState<Periodo>('today');
  const { data, isLoading, isError, refetch, isRefetching } = useDashboard();

  const iniciales = (usuario?.nombre || 'MF')
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={c.brand} />
        }
      >
        <View style={styles.top}>
          <View>
            <Text style={styles.hola}>Hola,</Text>
            <Text style={styles.empresa}>{usuario?.nombre || 'tu empresa'}</Text>
          </View>
          <Pressable style={styles.avatar} onPress={() => void cerrar()}>
            <Text style={styles.avatarText}>{iniciales}</Text>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {PERIODOS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.tab, periodo === p.id && styles.tabActivo]}
              onPress={() => setPeriodo(p.id)}
            >
              <Text style={[styles.tabText, periodo === p.id && styles.tabTextActivo]}>{p.etiqueta}</Text>
            </Pressable>
          ))}
        </View>

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
            <View style={styles.kpiGrande}>
              <Text style={styles.kpiLabel}>Vendido</Text>
              <Text style={styles.kpiMonto}>{fmtMoneda(data?.vendido ?? 0)}</Text>
            </View>
            <View style={styles.fila}>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Comprobantes</Text>
                <Text style={styles.kpiValor}>{fmtNumero(data?.comprobantes ?? 0)}</Text>
              </View>
              <View style={styles.kpi}>
                <Text style={styles.kpiLabel}>Ticket prom.</Text>
                <Text style={styles.kpiValor}>{fmtMoneda(data?.ticketPromedio ?? 0)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  content: { padding: 20, gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  hola: { fontSize: 14, color: c.muted },
  empresa: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: c.brand, fontWeight: '800', fontSize: 14 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: c.surfaceAlt,
    borderRadius: radios.md,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: radios.sm, alignItems: 'center' },
  tabActivo: { backgroundColor: c.surface },
  tabText: { fontSize: 14, fontWeight: '600', color: c.muted },
  tabTextActivo: { color: c.text },
  estado: { paddingVertical: 50, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  kpiGrande: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
  },
  kpiLabel: { fontSize: 13, color: c.muted, fontWeight: '600' },
  kpiMonto: { fontSize: 34, fontWeight: '800', color: c.text, marginTop: 6, letterSpacing: -0.5 },
  fila: { flexDirection: 'row', gap: 12 },
  kpi: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
  },
  kpiValor: { fontSize: 22, fontWeight: '800', color: c.text, marginTop: 6 },
});
