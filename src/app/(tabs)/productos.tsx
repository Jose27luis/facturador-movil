import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletaClara, radios } from '@/core/theme/tokens';
import { fmtMonto, fmtNumero } from '@/shared/format';
import { Producto } from '@/features/productos/productos.types';
import { useProductos } from '@/features/productos/use-productos';

const c = paletaClara;

export default function ProductosScreen() {
  const [texto, setTexto] = useState('');
  const { data, isLoading, isError } = useProductos(texto);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Productos</Text>
      </View>
      <TextInput
        style={styles.input}
        value={texto}
        onChangeText={setTexto}
        accessibilityLabel="Buscar producto por nombre o código"
      />

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : isError ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se pudieron cargar los productos.</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <View style={styles.estado}>
              <Text style={styles.estadoText}>Sin resultados.</Text>
            </View>
          }
          renderItem={({ item }) => <Fila item={item} />}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item }: { item: Producto }) {
  return (
    <View style={styles.fila}>
      {item.imagen ? (
        <Image source={{ uri: item.imagen }} style={styles.imagen} />
      ) : (
        <View style={[styles.imagen, styles.imagenVacia]}>
          <Text style={styles.imagenInicial}>{item.nombre.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>
          {item.nombre}
        </Text>
        {item.codigo ? <Text style={styles.codigo}>{item.codigo}</Text> : null}
        <View style={styles.metaFila}>
          <Text style={styles.precio}>{fmtMonto(item.precio, item.moneda)}</Text>
          <Text style={styles.stock}>Stock {fmtNumero(item.stock)}</Text>
        </View>
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
    flexDirection: 'row',
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 12,
    gap: 12,
  },
  imagen: { width: 56, height: 56, borderRadius: radios.md, backgroundColor: c.surfaceAlt },
  imagenVacia: { alignItems: 'center', justifyContent: 'center' },
  imagenInicial: { fontSize: 22, fontWeight: '800', color: c.faint },
  info: { flex: 1, justifyContent: 'center', gap: 2 },
  nombre: { fontSize: 15, fontWeight: '700', color: c.text },
  codigo: { fontSize: 12, color: c.faint },
  metaFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  precio: { fontSize: 15, fontWeight: '800', color: c.text },
  stock: { fontSize: 13, color: c.muted },
});
