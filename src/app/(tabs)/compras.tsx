import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletaClara, radios } from '@/core/theme/tokens';
import { fmtMonto } from '@/shared/format';
import { BadgeEstado } from '@/shared/ui/badge-estado';
import { Compra, tonoPago } from '@/features/compras/compras.types';
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
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={setTexto}
        accessibilityLabel="Buscar compra por serie o número"
      />

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
          renderItem={({ item }) => <Fila item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item }: { item: Compra }) {
  return (
    <View style={styles.fila}>
      <View style={styles.filaTop}>
        <Text style={styles.numero}>{item.numero}</Text>
        <Text style={styles.monto}>{fmtMonto(item.total, item.moneda)}</Text>
      </View>
      <Text style={styles.proveedor} numberOfLines={1}>
        {item.proveedor || 'Sin proveedor'}
      </Text>
      <View style={styles.filaBottom}>
        <Text style={styles.fecha}>
          {item.tipo} · {item.fecha}
        </Text>
        <BadgeEstado tono={tonoPago(item.pagado)} etiqueta={item.estadoPago} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.4 },
  input: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    marginHorizontal: 20,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: c.text,
  },
  estado: { paddingVertical: 60, alignItems: 'center' },
  estadoText: { color: c.muted, fontSize: 14 },
  lista: { paddingHorizontal: 20, paddingVertical: 12 },
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
  proveedor: { fontSize: 14, color: c.muted },
  filaBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontSize: 12, color: c.faint },
});
