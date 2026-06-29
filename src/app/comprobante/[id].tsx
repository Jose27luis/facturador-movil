import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { volver } from '@/shared/navegar';

import { useState } from 'react';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMonto } from '@/shared/format';
import { VisorPdf } from '@/shared/ui/visor-pdf';
import { BadgeEstado } from '@/shared/ui/badge-estado';
import { LineaComprobante, tonoEstado } from '@/features/ventas/ventas.types';
import { useComprobante, useComprobanteDetalle } from '@/features/ventas/use-ventas';

export default function ComprobanteScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const { id, nv } = useLocalSearchParams<{ id: string; nv?: string }>();
  const insets = useSafeAreaInsets();
  const idNum = Number(id);
  const esNotaVenta = nv === '1';
  const [verPdf, setVerPdf] = useState(false);
  const { data: base } = useComprobante(idNum, esNotaVenta);
  const { data: detalle, isLoading, isError } = useComprobanteDetalle(idNum, esNotaVenta);

  const tipo = detalle?.tipo ?? base?.tipo ?? '';
  const numero = detalle?.numero ?? base?.numero ?? '';
  const estadoId = detalle?.estadoId ?? base?.estadoId ?? '';
  const estado = detalle?.estado ?? base?.estado ?? '';
  const moneda = detalle?.moneda ?? base?.moneda ?? 'PEN';
  const total = detalle?.total ?? base?.total ?? 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.volver} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Comprobante</Text>
        <View style={styles.volver} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.hero}>
          <Text style={styles.tipo}>{tipo}</Text>
          <Text style={styles.numero}>{numero}</Text>
          <Text style={styles.total}>{fmtMonto(total, moneda)}</Text>
          {estado ? <BadgeEstado tono={tonoEstado(estadoId)} etiqueta={estado} /> : null}
        </View>

        <View style={styles.card}>
          <Dato etiqueta="Cliente" valor={detalle?.cliente || base?.cliente || '—'} />
          <Dato etiqueta="Documento" valor={detalle?.clienteDoc || base?.clienteDoc || '—'} />
          <Dato etiqueta="Fecha de emisión" valor={detalle?.fecha || base?.fecha || '—'} ultimo />
        </View>

        <View style={styles.card}>
          <Text style={styles.seccion}>Items</Text>
          {isLoading ? (
            <ActivityIndicator color={c.brand} style={styles.carga} />
          ) : isError ? (
            <Text style={styles.vacio}>No se pudo cargar el detalle.</Text>
          ) : (detalle?.items.length ?? 0) === 0 ? (
            <Text style={styles.vacio}>Sin items.</Text>
          ) : (
            <>
              {detalle?.items.map((it, i) => <Linea key={i} item={it} moneda={moneda} />)}
              <View style={styles.divisor} />
              {detalle && detalle.totalGravado > 0 ? (
                <Resumen etiqueta="Op. gravada" valor={fmtMonto(detalle.totalGravado, moneda)} />
              ) : null}
              {detalle && detalle.totalExonerado > 0 ? (
                <Resumen etiqueta="Op. exonerada" valor={fmtMonto(detalle.totalExonerado, moneda)} />
              ) : null}
              {detalle && detalle.totalIgv > 0 ? (
                <Resumen etiqueta="IGV (18%)" valor={fmtMonto(detalle.totalIgv, moneda)} />
              ) : null}
              <View style={styles.totalFila}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalMonto}>{fmtMonto(total, moneda)}</Text>
              </View>
            </>
          )}
        </View>

        {detalle?.pdfUrl ? (
          <Pressable style={styles.verPdf} onPress={() => setVerPdf(true)}>
            <Ionicons name="document-text-outline" size={20} color={c.onBrand} />
            <Text style={styles.verPdfText}>Ver / Enviar PDF</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {detalle && verPdf ? (
        <VisorPdf
          visible
          numero={detalle.numero}
          a4Url={detalle.pdfUrl}
          ticketUrl={detalle.pdfTicket}
          onCerrar={() => setVerPdf(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function Linea({ item, moneda }: { item: LineaComprobante; moneda: string }) {
  const c = useTema();
  const styles = useEstilos(crear);
  return (
    <View style={styles.linea}>
      <View style={styles.lineaInfo}>
        <Text style={styles.lineaNombre}>{item.descripcion}</Text>
        <Text style={styles.lineaSub}>
          {item.cantidad} × {fmtMonto(item.precioUnitario, moneda)}
        </Text>
      </View>
      <Text style={styles.lineaTotal}>{fmtMonto(item.total, moneda)}</Text>
    </View>
  );
}

function Resumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const c = useTema();
  const styles = useEstilos(crear);
  return (
    <View style={styles.resumen}>
      <Text style={styles.resumenLabel}>{etiqueta}</Text>
      <Text style={styles.resumenValor}>{valor}</Text>
    </View>
  );
}

function Dato({ etiqueta, valor, ultimo }: { etiqueta: string; valor: string; ultimo?: boolean }) {
  const c = useTema();
  const styles = useEstilos(crear);
  return (
    <View style={[styles.dato, ultimo && styles.datoUltimo]}>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
      <Text style={styles.datoValor}>{valor}</Text>
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
  volver: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
  content: { padding: 20, gap: 16 },
  hero: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 20,
    gap: 6,
    alignItems: 'flex-start',
  },
  tipo: { fontSize: 13, color: c.muted, fontWeight: '600' },
  numero: { fontFamily: c.monoSemi, fontSize: 20, color: c.text },
  total: { fontFamily: c.monoSemi, fontSize: 30, color: c.text, marginVertical: 4, letterSpacing: -0.5 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radios.lg,
    borderWidth: 1,
    borderColor: c.border,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  seccion: {
    fontSize: 13,
    fontWeight: '700',
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 14,
    marginBottom: 6,
  },
  carga: { marginVertical: 20 },
  vacio: { fontSize: 13, color: c.faint, paddingVertical: 16 },
  linea: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  lineaInfo: { flex: 1, paddingRight: 12 },
  lineaNombre: { fontSize: 13.5, fontWeight: '600', color: c.text },
  lineaSub: { fontFamily: c.mono, fontSize: 12, color: c.muted, marginTop: 2 },
  lineaTotal: { fontFamily: c.monoSemi, fontSize: 13.5, color: c.text },
  divisor: { height: 1, backgroundColor: c.surfaceAlt, marginVertical: 10 },
  resumen: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  resumenLabel: { fontSize: 13, color: c.muted },
  resumenValor: { fontFamily: c.mono, fontSize: 13, color: c.text },
  totalFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: c.text },
  totalMonto: { fontFamily: c.monoSemi, fontSize: 20, color: c.text },
  dato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  datoUltimo: { borderBottomWidth: 0 },
  datoEtiqueta: { fontSize: 14, color: c.muted },
  datoValor: { fontSize: 14, fontWeight: '600', color: c.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  verPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 15,
  },
  verPdfText: { fontSize: 15, fontWeight: '700', color: c.onBrand },
});

