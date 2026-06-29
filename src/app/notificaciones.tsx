import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { volver } from '@/shared/navegar';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { Alerta, SeveridadAlerta } from '@/features/dashboard/overview.types';
import { useOverview } from '@/features/dashboard/use-overview';

const estilosSeveridad: Record<
  SeveridadAlerta,
  { bg: string; color: string; icono: keyof typeof Ionicons.glyphMap }
> = {
  danger: { bg: '#F3DDDD', color: '#B23B3B', icono: 'alert-circle' },
  warning: { bg: '#F4EAD4', color: '#B5791A', icono: 'warning' },
  info: { bg: '#E7EEF4', color: '#2A5E86', icono: 'information-circle' },
};

export default function NotificacionesScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const { data, isLoading, isError, refetch, isRefetching } = useOverview();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Notificaciones</Text>
        <View style={styles.iconoBtn} />
      </View>

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : isError ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se pudieron cargar las notificaciones.</Text>
        </View>
      ) : (
        <FlatList
          data={data?.alertas ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.lista}
          onRefresh={() => void refetch()}
          refreshing={isRefetching}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="checkmark-circle-outline" size={40} color={c.ok} />
              <Text style={styles.vacioText}>Todo en orden, sin problemas.</Text>
            </View>
          }
          renderItem={({ item }) => <Fila alerta={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ alerta }: { alerta: Alerta }) {
  const c = useTema();
  const styles = useEstilos(crear);
  const s = estilosSeveridad[alerta.severity];
  return (
    <View style={styles.fila}>
      <View style={[styles.icono, { backgroundColor: s.bg }]}>
        <Ionicons name={s.icono} size={20} color={s.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.titulo}>{alerta.title}</Text>
        <Text style={styles.detalle}>{alerta.detail}</Text>
      </View>
    </View>
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
  headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
  estado: { paddingVertical: 60, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  lista: { padding: 20 },
  sep: { height: 10 },
  vacio: { paddingVertical: 60, alignItems: 'center', gap: 12 },
  vacioText: { color: c.muted, fontSize: 14 },
  fila: {
    flexDirection: 'row',
    gap: 13,
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 14,
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  titulo: { fontSize: 14.5, fontWeight: '700', color: c.text },
  detalle: { fontSize: 13, color: c.muted, marginTop: 3, lineHeight: 18 },
});
