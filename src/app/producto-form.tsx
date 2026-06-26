import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { paletaClara, radios } from '@/core/theme/tokens';
import {
  useActualizarProducto,
  useCrearProducto,
  useDesactivarProducto,
} from '@/features/productos/use-productos';

const c = paletaClara;

function aNumero(texto: string): number {
  const limpio = texto.replace(',', '.').replace(/[^0-9.]/g, '');
  const n = Number(limpio);
  return Number.isNaN(n) ? 0 : n;
}

export default function ProductoFormScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; nombre?: string; precio?: string }>();
  const idNum = params.id ? Number(params.id) : 0;
  const edicion = idNum > 0;

  const [nombre, setNombre] = useState(params.nombre ?? '');
  const [precio, setPrecio] = useState(params.precio ?? '');
  const [stock, setStock] = useState('0');
  const [afectacion, setAfectacion] = useState<'10' | '20'>('10');

  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const desactivar = useDesactivarProducto();
  const guardando = crear.isPending || actualizar.isPending || desactivar.isPending;

  const puedeGuardar = nombre.trim() !== '' && aNumero(precio) > 0 && !guardando;

  function onGuardar() {
    if (!puedeGuardar) {
      return;
    }
    const ok = () => {
      Alert.alert(edicion ? 'Producto actualizado' : 'Producto registrado', nombre.trim(), [
        { text: 'Aceptar', onPress: () => router.back() },
      ]);
    };
    const fail = (err: unknown) => {
      Alert.alert('No se pudo guardar', err instanceof Error ? err.message : 'Error desconocido');
    };

    if (edicion) {
      actualizar.mutate(
        { id: idNum, payload: { description: nombre.trim(), sale_unit_price: aNumero(precio) } },
        { onSuccess: ok, onError: fail },
      );
    } else {
      crear.mutate(
        {
          description: nombre.trim(),
          sale_unit_price: aNumero(precio),
          stock: aNumero(stock),
          sale_affectation_igv_type_id: afectacion,
        },
        { onSuccess: ok, onError: fail },
      );
    }
  }

  function onDesactivar() {
    Alert.alert(
      'Desactivar producto',
      `${nombre.trim()} dejará de aparecer en el catálogo y no se podrá vender. El historial se conserva. Puedes reactivarlo desde el panel web.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () =>
            desactivar.mutate(idNum, {
              onSuccess: () =>
                Alert.alert('Producto desactivado', nombre.trim(), [
                  { text: 'Aceptar', onPress: () => router.back() },
                ]),
              onError: (err) =>
                Alert.alert('No se pudo desactivar', err instanceof Error ? err.message : 'Error desconocido'),
            }),
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => router.back()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>{edicion ? 'Editar producto' : 'Nuevo producto'}</Text>
        <View style={styles.iconoBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
            accessibilityLabel="Nombre del producto"
          />

          <Text style={styles.label}>Precio de venta (S/)</Text>
          <TextInput
            style={styles.input}
            value={precio}
            onChangeText={setPrecio}
            keyboardType="decimal-pad"
            accessibilityLabel="Precio de venta"
          />

          {edicion ? (
            <>
              <Text style={styles.nota}>
                El stock y la afectación de IGV se administran desde el panel web de pro8.
              </Text>
              <Pressable style={styles.desactivar} onPress={onDesactivar} disabled={guardando}>
                <Ionicons name="archive-outline" size={18} color={c.danger} />
                <Text style={styles.desactivarText}>Desactivar producto</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Stock inicial</Text>
              <TextInput
                style={styles.input}
                value={stock}
                onChangeText={setStock}
                keyboardType="number-pad"
                accessibilityLabel="Stock inicial"
              />

              <Text style={styles.label}>Afectación IGV</Text>
              <View style={styles.opciones}>
                <Pressable
                  style={[styles.opcion, afectacion === '10' && styles.opcionActiva]}
                  onPress={() => setAfectacion('10')}
                >
                  <Text style={[styles.opcionText, afectacion === '10' && styles.opcionTextActiva]}>
                    Gravado · 18%
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.opcion, afectacion === '20' && styles.opcionActiva]}
                  onPress={() => setAfectacion('20')}
                >
                  <Text style={[styles.opcionText, afectacion === '20' && styles.opcionTextActiva]}>
                    Exonerado
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable
            style={[styles.guardar, !puedeGuardar && styles.guardarOff]}
            onPress={onGuardar}
            disabled={!puedeGuardar}
          >
            {guardando ? (
              <ActivityIndicator color={c.onBrand} />
            ) : (
              <Text style={styles.guardarText}>{edicion ? 'Guardar cambios' : 'Registrar producto'}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconoBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
  content: { padding: 20 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A7163',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 7,
    marginTop: 16,
  },
  input: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: radios.md,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 15,
    color: c.text,
  },
  nota: { fontSize: 12.5, color: c.muted, marginTop: 18, lineHeight: 18 },
  desactivar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E6C9C9',
    backgroundColor: '#F9EEEE',
    borderRadius: radios.md,
    paddingVertical: 14,
    marginTop: 22,
  },
  desactivarText: { color: c.danger, fontSize: 15, fontWeight: '700' },
  opciones: { flexDirection: 'row', gap: 10 },
  opcion: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  opcionActiva: { backgroundColor: c.brand, borderColor: c.brand },
  opcionText: { fontSize: 14, fontWeight: '600', color: c.text },
  opcionTextActiva: { color: c.onBrand },
  footer: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    padding: 20,
  },
  guardar: {
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  guardarOff: { opacity: 0.5 },
  guardarText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
});
