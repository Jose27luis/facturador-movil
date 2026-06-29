import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMonto, fmtNumero } from '@/shared/format';
import { Producto } from '@/features/productos/productos.types';
import { useProductos } from '@/features/productos/use-productos';

export default function ProductosScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const { data, isLoading, isError } = useProductos(texto);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Productos</Text>
        <Pressable style={styles.nuevo} onPress={() => router.push('/producto-form')}>
          <Ionicons name="add" size={20} color={c.onBrand} />
          <Text style={styles.nuevoText}>Nuevo</Text>
        </Pressable>
      </View>
      <View style={styles.busqueda}>
        <Ionicons name="search" size={17} color={c.faint} />
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          accessibilityLabel="Buscar en el catálogo"
        />
      </View>

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
          renderItem={({ item }) => (
            <Fila
              item={item}
              onPress={() =>
                router.push({
                  pathname: '/producto-form',
                  params: { id: String(item.id), nombre: item.nombre, precio: String(item.precio) },
                })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item, onPress }: { item: Producto; onPress: () => void }) {
  const c = useTema();
  const styles = useEstilos(crear);
  return (
    <Pressable style={styles.fila} onPress={onPress}>
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
      <Ionicons name="chevron-forward" size={18} color={c.faint} />
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.4 },
  nuevo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: c.brand,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  nuevoText: { color: c.onBrand, fontWeight: '700', fontSize: 14 },
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
  precio: { fontFamily: c.monoSemi, fontSize: 14, color: c.text },
  stock: { fontSize: 13, color: c.muted },
});
