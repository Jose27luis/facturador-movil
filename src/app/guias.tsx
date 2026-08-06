import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { volver } from '@/shared/navegar';
import { BadgeEstado } from '@/shared/ui/badge-estado';
import { VisorPdf } from '@/shared/ui/visor-pdf';
import { tonoEstado } from '@/features/ventas/ventas.types';
import { Guia } from '@/features/guias/guias.types';
import { useGuias } from '@/features/guias/use-guias';

export default function GuiasScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const { data, isLoading, isError, refetch, isRefetching } = useGuias();
  const [verGuia, setVerGuia] = useState<Guia | null>(null);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Guías de remisión</Text>
        <View style={styles.iconoBtn} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={c.brand} style={styles.carga} />
      ) : isError ? (
        <Text style={styles.vacio}>No se pudieron cargar las guías.</Text>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={c.brand}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={
            <Text style={styles.vacio}>
              Aún no has generado guías. Puedes crearlas desde el detalle de una factura o boleta.
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable style={styles.fila} onPress={() => setVerGuia(item)}>
              <View style={styles.icono}>
                <Ionicons name="cube-outline" size={20} color={c.brand} />
              </View>
              <View style={styles.info}>
                <View style={styles.filaTop}>
                  <Text style={styles.numero}>{item.numero}</Text>
                  {item.estado ? (
                    <BadgeEstado tono={tonoEstado(item.estadoId)} etiqueta={item.estado} />
                  ) : null}
                </View>
                <Text style={styles.cliente} numberOfLines={1}>
                  {item.cliente || 'Sin destinatario'}
                </Text>
              </View>
              <Text style={styles.fecha}>{item.fecha}</Text>
            </Pressable>
          )}
        />
      )}

      {verGuia ? (
        <VisorPdf
          visible
          numero={verGuia.numero}
          a4Url={verGuia.pdfUrl}
          ticketUrl=""
          onCerrar={() => setVerGuia(null)}
        />
      ) : null}
    </SafeAreaView>
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
    headerTitulo: { fontSize: 17, fontWeight: '700', color: c.text },
    carga: { marginTop: 60 },
    vacio: {
      textAlign: 'center',
      color: c.muted,
      marginTop: 50,
      fontSize: 14,
      paddingHorizontal: 40,
      lineHeight: 20,
    },
    lista: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
    sep: { height: 10 },
    fila: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 15,
      padding: 13,
    },
    icono: {
      width: 40,
      height: 40,
      borderRadius: 11,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, minWidth: 0 },
    filaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    numero: { fontFamily: c.mono, fontSize: 13, color: c.text },
    cliente: { fontSize: 13, color: c.muted, marginTop: 3 },
    fecha: { fontSize: 11.5, color: c.faint },
  });
