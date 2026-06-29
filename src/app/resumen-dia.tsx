import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMoneda, fmtNumero } from '@/shared/format';
import { volver } from '@/shared/navegar';
import { SelectorFecha } from '@/shared/ui/selector-fecha';
import { ResumenDia } from '@/features/caja/caja.types';
import { useResumenDia } from '@/features/caja/use-caja';

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fechaLegible(iso: string): string {
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function textoResumen(r: ResumenDia): string {
  const lineas = [
    `Ventas del ${fechaLegible(r.fecha)}`,
    `Total vendido: ${fmtMoneda(r.total)}`,
    `Comprobantes: ${r.comprobantes} (F:${r.facturas} B:${r.boletas} NV:${r.notasVenta})`,
    '',
    'Por medio de pago:',
    ...r.mediosPago.map((m) => `- ${m.descripcion}: ${fmtMoneda(m.total)} (${m.count})`),
  ];
  return lineas.join('\n');
}

export default function ResumenDiaScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const hoy = hoyISO();

  const [fecha, setFecha] = useState(hoy);
  const [calOpen, setCalOpen] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useResumenDia(fecha);

  const esHoy = fecha === hoy;
  const fechaTexto = useMemo(() => fechaLegible(fecha), [fecha]);

  function compartir() {
    if (!data) {
      return;
    }
    void Share.share({ message: textoResumen(data) });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Ventas por día</Text>
        <Pressable
          style={styles.iconoBtn}
          onPress={compartir}
          disabled={!data}
          accessibilityLabel="Compartir resumen"
        >
          <Ionicons name="share-outline" size={22} color={data ? c.text : c.faint} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <Pressable style={styles.fechaCard} onPress={() => setCalOpen(true)}>
          <Ionicons name="calendar-outline" size={20} color={c.accent} />
          <Text style={styles.fechaValor}>{fechaTexto}</Text>
          {esHoy ? <Text style={styles.fechaHoy}>Hoy</Text> : null}
          <View style={styles.flex} />
          <Ionicons name="chevron-down" size={18} color={c.faint} />
        </Pressable>

        {isLoading ? (
          <View style={styles.estado}>
            <ActivityIndicator color={c.brand} />
          </View>
        ) : isError ? (
          <View style={styles.estado}>
            <Text style={styles.estadoText}>No se pudo cargar el resumen.</Text>
            <Pressable style={styles.reintentar} onPress={() => void refetch()}>
              <Text style={styles.reintentarText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : data ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroLabel}>Total vendido</Text>
              <Text style={styles.heroMonto}>{fmtMoneda(data.total)}</Text>
            </View>

            <View style={styles.fila}>
              <Conteo etiqueta="Facturas" valor={data.facturas} />
              <Conteo etiqueta="Boletas" valor={data.boletas} />
              <Conteo etiqueta="Notas venta" valor={data.notasVenta} />
            </View>

            <Text style={styles.seccion}>Por medio de pago</Text>
            {data.mediosPago.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.vacio}>Sin pagos registrados en esta fecha.</Text>
              </View>
            ) : (
              <View style={styles.card}>
                {data.mediosPago.map((m, i) => (
                  <View
                    key={m.id}
                    style={[styles.medioFila, i < data.mediosPago.length - 1 && styles.medioBorde]}
                  >
                    <View style={styles.medioInfo}>
                      <Text style={styles.medioNombre}>{m.descripcion}</Text>
                      <Text style={styles.medioCount}>{m.count} pago(s)</Text>
                    </View>
                    <Text style={styles.medioTotal}>{fmtMoneda(m.total)}</Text>
                  </View>
                ))}
              </View>
            )}

            {isFetching ? <ActivityIndicator color={c.brand} style={styles.recarga} /> : null}
          </>
        ) : null}
      </ScrollView>

      {calOpen ? (
        <SelectorFecha
          visible
          valor={fecha}
          maxima={hoy}
          onCerrar={() => setCalOpen(false)}
          onElegir={(iso) => {
            setFecha(iso);
            setCalOpen(false);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Conteo({ etiqueta, valor }: { etiqueta: string; valor: number }) {
  const styles = useEstilos(crear);
  return (
    <View style={styles.conteo}>
      <Text style={styles.conteoValor}>{fmtNumero(valor)}</Text>
      <Text style={styles.conteoLabel}>{etiqueta}</Text>
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
    content: { padding: 20, gap: 14 },
    flex: { flex: 1 },
    fechaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    fechaValor: { fontSize: 15, fontWeight: '600', color: c.text },
    fechaHoy: {
      fontSize: 11,
      fontWeight: '700',
      color: c.onBrand,
      backgroundColor: c.brand,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
      overflow: 'hidden',
    },
    estado: { paddingVertical: 50, alignItems: 'center', gap: 14 },
    estadoText: { color: c.muted, fontSize: 14 },
    reintentar: {
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: radios.sm,
    },
    reintentarText: { color: c.text, fontWeight: '700', fontSize: 14 },
    hero: { backgroundColor: c.brand, borderRadius: radios.xl, padding: 22 },
    heroLabel: {
      fontSize: 12.5,
      color: '#B8AF9C',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroMonto: {
      fontFamily: c.monoSemi,
      fontSize: 36,
      color: c.onBrand,
      letterSpacing: -1,
      marginTop: 8,
    },
    fila: { flexDirection: 'row', gap: 12 },
    conteo: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 14,
      alignItems: 'center',
    },
    conteoValor: { fontFamily: c.monoSemi, fontSize: 22, color: c.text },
    conteoLabel: { fontSize: 11.5, color: c.muted, fontWeight: '600', marginTop: 3 },
    seccion: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 6,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 16,
    },
    vacio: { fontSize: 13.5, color: c.muted, paddingVertical: 18, lineHeight: 19 },
    medioFila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    medioBorde: { borderBottomWidth: 1, borderBottomColor: c.border },
    medioInfo: { flex: 1 },
    medioNombre: { fontSize: 15, fontWeight: '600', color: c.text },
    medioCount: { fontSize: 12.5, color: c.muted, marginTop: 2 },
    medioTotal: { fontFamily: c.monoSemi, fontSize: 16, color: c.text },
    recarga: { marginTop: 8 },
  });
