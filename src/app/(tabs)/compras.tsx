import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fuentes, paletaClara, radios } from '@/core/theme/tokens';
import { fmtMonto } from '@/shared/format';
import { Compra } from '@/features/compras/compras.types';
import { useCompras } from '@/features/compras/use-compras';

const c = paletaClara;

export default function ComprasScreen() {
  const [texto, setTexto] = useState('');
  const { data, isLoading, isError } = useCompras(texto);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Compras</Text>
      </View>
      <View style={styles.busqueda}>
        <Ionicons name="search" size={17} color={c.faint} />
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          accessibilityLabel="Buscar por proveedor o documento"
        />
      </View>

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : isError ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se pudieron cargar las compras.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.estado}>
              <Text style={styles.estadoText}>Aún no hay compras registradas.</Text>
            </View>
          }
          ListFooterComponent={
            <View style={styles.nota}>
              <Ionicons name="information-circle-outline" size={18} color={c.muted} />
              <Text style={styles.notaText}>
                Las compras se sincronizan con pro8. El registro completo desde el móvil llega en la
                próxima fase.
              </Text>
            </View>
          }
          renderItem={({ item }) => <Fila item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item }: { item: Compra }) {
  return (
    <View style={styles.fila}>
      <View style={styles.thumb}>
        <Ionicons name="cart-outline" size={20} color={c.muted} />
      </View>
      <View style={styles.info}>
        <Text style={styles.proveedor} numberOfLines={1}>
          {item.proveedor || 'Sin proveedor'}
        </Text>
        <Text style={styles.meta}>
          {item.numero} · {item.fecha}
        </Text>
        <Text style={[styles.pago, { color: item.pagado ? c.ok : c.warn }]}>{item.estadoPago}</Text>
      </View>
      <Text style={styles.monto}>{fmtMonto(item.total, item.moneda)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.6 },
  busqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: radios.md,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 13,
    height: 46,
  },
  input: { flex: 1, fontSize: 15, color: c.text },
  estado: { paddingVertical: 60, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  lista: { paddingHorizontal: 20, paddingVertical: 12 },
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
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, minWidth: 0 },
  proveedor: { fontSize: 14, fontWeight: '600', color: c.text },
  meta: { fontFamily: fuentes.mono, fontSize: 12, color: c.muted, marginTop: 3 },
  pago: { fontSize: 11.5, fontWeight: '700', marginTop: 3 },
  monto: { fontFamily: fuentes.monoSemi, fontSize: 14, color: c.text },
  nota: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: c.surfaceAlt,
    borderRadius: 13,
    padding: 13,
    marginTop: 12,
  },
  notaText: { flex: 1, fontSize: 12, color: '#6E665B', lineHeight: 18 },
});
