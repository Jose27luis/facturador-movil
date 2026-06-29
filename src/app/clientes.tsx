import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { volver } from '@/shared/navegar';
import { ClienteListado } from '@/features/clientes/clientes.types';
import { useBuscarClientes } from '@/features/clientes/use-clientes';

export default function ClientesScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const { data, isFetching } = useBuscarClientes(texto);
  const corto = texto.trim().length < 2;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Clientes</Text>
        <View style={styles.iconoBtn} />
      </View>

      <View style={styles.busqueda}>
        <Ionicons name="search" size={17} color={c.faint} />
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          autoFocus
          accessibilityLabel="Buscar por nombre, DNI o RUC"
        />
      </View>

      {corto ? (
        <View style={styles.estado}>
          <Ionicons name="people-outline" size={40} color={c.faint} />
          <Text style={styles.estadoText}>Escribe el nombre, DNI o RUC del cliente.</Text>
        </View>
      ) : isFetching ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
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
                router.push({ pathname: '/cliente/[id]', params: { id: String(item.id), nombre: item.nombre } })
              }
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function Fila({ item, onPress }: { item: ClienteListado; onPress: () => void }) {
  const c = useTema();
  const styles = useEstilos(crear);
  return (
    <Pressable style={styles.fila} onPress={onPress}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.nombre || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={1}>
          {item.nombre || 'Sin nombre'}
        </Text>
        <Text style={styles.numero}>{item.numero}</Text>
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
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    iconoBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
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
    estado: { paddingVertical: 50, alignItems: 'center', gap: 12 },
    estadoText: { color: c.muted, fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
    lista: { paddingHorizontal: 20, paddingVertical: 12 },
    sep: { height: 10 },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '800', color: c.muted },
    info: { flex: 1, minWidth: 0 },
    nombre: { fontSize: 15, fontWeight: '700', color: c.text },
    numero: { fontFamily: c.mono, fontSize: 13, color: c.muted, marginTop: 2 },
  });
