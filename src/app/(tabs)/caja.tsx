import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMoneda } from '@/shared/format';
import { VisorPdf } from '@/shared/ui/visor-pdf';
import { EstadoCaja, MedioPagoResumen } from '@/features/caja/caja.types';
import { useAbrirCaja, useCerrarCaja, useEstadoCaja } from '@/features/caja/use-caja';

function aMonto(texto: string): number {
  const limpio = texto.replace(',', '.').replace(/[^0-9.]/g, '');
  const n = Number(limpio);
  return Number.isNaN(n) ? 0 : n;
}

export default function CajaScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useEstadoCaja();
  const abrir = useAbrirCaja();
  const cerrar = useCerrarCaja();

  const [saldoInicial, setSaldoInicial] = useState('');
  const [cerrarOpen, setCerrarOpen] = useState(false);
  const [efectivoContado, setEfectivoContado] = useState('');
  const [reporteVer, setReporteVer] = useState<'caja' | 'productos' | null>(null);

  function onAbrir() {
    abrir.mutate(aMonto(saldoInicial), {
      onSuccess: () => setSaldoInicial(''),
      onError: (err) =>
        Alert.alert('No se pudo abrir', err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  function onCerrar() {
    const real = efectivoContado.trim() === '' ? null : aMonto(efectivoContado);
    cerrar.mutate(real, {
      onSuccess: (res) => {
        setCerrarOpen(false);
        setEfectivoContado('');
        const dif =
          res.diferencia === null
            ? ''
            : res.diferencia === 0
              ? '\nArqueo cuadrado.'
              : res.diferencia > 0
                ? `\nSobrante: ${fmtMoneda(res.diferencia)}`
                : `\nFaltante: ${fmtMoneda(Math.abs(res.diferencia))}`;
        Alert.alert(
          'Caja cerrada',
          `Ventas: ${fmtMoneda(res.ventas)}\nEsperado en efectivo: ${fmtMoneda(res.esperadoEfectivo)}${dif}`,
        );
      },
      onError: (err) =>
        Alert.alert('No se pudo cerrar', err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Caja</Text>
        <Pressable
          style={styles.iconoBtn}
          onPress={() => router.push('/resumen-dia')}
          accessibilityLabel="Ventas por día"
        >
          <Ionicons name="calendar-outline" size={22} color={c.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.estado}>
          <ActivityIndicator color={c.brand} />
        </View>
      ) : isError ? (
        <View style={styles.estado}>
          <Text style={styles.estadoText}>No se pudo cargar la caja.</Text>
          <Pressable style={styles.reintentar} onPress={() => void refetch()}>
            <Text style={styles.reintentarText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : data?.abierta ? (
        <CajaAbierta
          estado={data}
          onCerrar={() => setCerrarOpen(true)}
          onReporte={setReporteVer}
          insetsBottom={insets.bottom}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.cerrada}>
            <Ionicons name="lock-closed-outline" size={40} color={c.faint} />
            <Text style={styles.cerradaTitulo}>No tienes una caja abierta</Text>
            <Text style={styles.cerradaSub}>
              Abre la caja con el monto en efectivo con el que inicias el turno.
            </Text>
          </View>

          <Text style={styles.label}>Saldo inicial (S/)</Text>
          <View style={styles.montoBox}>
            <Text style={styles.montoSimbolo}>S/</Text>
            <TextInput
              style={styles.montoInput}
              value={saldoInicial}
              onChangeText={setSaldoInicial}
              keyboardType="decimal-pad"
              accessibilityLabel="Saldo inicial"
            />
          </View>

          <Pressable
            style={[styles.boton, abrir.isPending && styles.botonOff]}
            onPress={onAbrir}
            disabled={abrir.isPending}
          >
            {abrir.isPending ? (
              <ActivityIndicator color={c.onBrand} />
            ) : (
              <Text style={styles.botonText}>Abrir caja</Text>
            )}
          </Pressable>
        </ScrollView>
      )}

      <Modal visible={cerrarOpen} transparent animationType="slide" onRequestClose={() => setCerrarOpen(false)}>
        <View style={styles.modalFondo}>
          <View style={[styles.modalHoja, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalBarra} />
            <Text style={styles.modalTitulo}>Cerrar caja</Text>
            {data?.abierta ? (
              <>
                <View style={styles.arqueoFila}>
                  <Text style={styles.arqueoLabel}>Esperado en efectivo</Text>
                  <Text style={styles.arqueoValor}>{fmtMoneda(data.esperadoEfectivo)}</Text>
                </View>
                <Text style={styles.label}>Efectivo contado (opcional)</Text>
                <View style={styles.montoBox}>
                  <Text style={styles.montoSimbolo}>S/</Text>
                  <TextInput
                    style={styles.montoInput}
                    value={efectivoContado}
                    onChangeText={setEfectivoContado}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Efectivo contado"
                  />
                </View>
                {efectivoContado.trim() !== '' ? (
                  <Diferencia esperado={data.esperadoEfectivo} contado={aMonto(efectivoContado)} />
                ) : null}
              </>
            ) : null}
            <View style={styles.modalAcciones}>
              <Pressable style={styles.modalCancelar} onPress={() => setCerrarOpen(false)}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmar, cerrar.isPending && styles.botonOff]}
                onPress={onCerrar}
                disabled={cerrar.isPending}
              >
                {cerrar.isPending ? (
                  <ActivityIndicator color={c.onBrand} />
                ) : (
                  <Text style={styles.modalConfirmarText}>Cerrar caja</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {reporteVer && data?.abierta ? (
        <VisorPdf
          visible
          numero={reporteVer === 'caja' ? 'Reporte de caja' : 'Productos vendidos'}
          a4Url={reporteVer === 'caja' ? data.reportes.a4 : data.reportes.productos}
          ticketUrl={reporteVer === 'caja' ? data.reportes.ticket : ''}
          onCerrar={() => setReporteVer(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function CajaAbierta({
  estado,
  onCerrar,
  onReporte,
  insetsBottom,
}: {
  estado: EstadoCaja;
  onCerrar: () => void;
  onReporte: (tipo: 'caja' | 'productos') => void;
  insetsBottom: number;
}) {
  const c = useTema();
  const styles = useEstilos(crear);
  return (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insetsBottom + 90 }]}>
        <View style={styles.abiertaTag}>
          <View style={styles.puntoVerde} />
          <Text style={styles.abiertaTagText}>Caja abierta · {estado.usuario}</Text>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>Esperado en efectivo</Text>
          <Text style={styles.heroMonto}>{fmtMoneda(estado.esperadoEfectivo)}</Text>
          <Text style={styles.heroSub}>
            Saldo inicial {fmtMoneda(estado.saldoInicial)} · desde {estado.horaApertura?.slice(0, 5)}
          </Text>
        </View>

        <View style={styles.fila}>
          <View style={styles.kpi}>
            <Text style={styles.kpiValor}>{fmtMoneda(estado.ventas)}</Text>
            <Text style={styles.kpiLabel}>Ventas del turno</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiValor}>{estado.comprobantes}</Text>
            <Text style={styles.kpiLabel}>Comprobantes</Text>
          </View>
        </View>

        <Text style={styles.seccion}>Por medio de pago</Text>
        {estado.mediosPago.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.vacio}>Aún no hay ventas en este turno.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {estado.mediosPago.map((m: MedioPagoResumen, i) => (
              <View
                key={m.id}
                style={[styles.medioFila, i < estado.mediosPago.length - 1 && styles.medioBorde]}
              >
                <Text style={styles.medioNombre}>{m.descripcion}</Text>
                <Text style={styles.medioTotal}>{fmtMoneda(m.total)}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.seccion}>Reportes</Text>
        <View style={styles.reportes}>
          <Pressable style={styles.reporteBtn} onPress={() => onReporte('caja')}>
            <Ionicons name="document-text-outline" size={22} color={c.text} />
            <Text style={styles.reporteText}>Reporte de caja</Text>
            <Text style={styles.reporteSub}>PDF y ticket</Text>
          </Pressable>
          <Pressable style={styles.reporteBtn} onPress={() => onReporte('productos')}>
            <Ionicons name="cube-outline" size={22} color={c.text} />
            <Text style={styles.reporteText}>Productos</Text>
            <Text style={styles.reporteSub}>Vendidos del turno</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insetsBottom + 14 }]}>
        <Pressable style={styles.cerrarBtn} onPress={onCerrar}>
          <Ionicons name="lock-closed-outline" size={20} color={c.onBrand} />
          <Text style={styles.cerrarBtnText}>Cerrar caja</Text>
        </Pressable>
      </View>
    </>
  );
}

function Diferencia({ esperado, contado }: { esperado: number; contado: number }) {
  const styles = useEstilos(crear);
  const dif = Math.round((contado - esperado) * 100) / 100;
  const falta = dif < 0;
  return (
    <View style={[styles.difCard, falta ? styles.difFalta : styles.difOk]}>
      <Text style={[styles.difLabel, falta && styles.difLabelFalta]}>
        {dif === 0 ? 'Cuadra' : falta ? 'Faltante' : 'Sobrante'}
      </Text>
      <Text style={[styles.difValor, falta && styles.difLabelFalta]}>{fmtMoneda(Math.abs(dif))}</Text>
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
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 8,
    },
    titulo: { fontSize: 26, fontWeight: '800', color: c.text, letterSpacing: -0.6 },
    iconoBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
    content: { padding: 20, gap: 14 },
    estado: { paddingVertical: 60, alignItems: 'center', gap: 14 },
    estadoText: { color: c.muted, fontSize: 14 },
    reintentar: {
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: radios.sm,
    },
    reintentarText: { color: c.text, fontWeight: '700', fontSize: 14 },
    cerrada: { alignItems: 'center', gap: 10, paddingVertical: 24 },
    cerradaTitulo: { fontSize: 17, fontWeight: '800', color: c.text },
    cerradaSub: { fontSize: 13.5, color: c.muted, textAlign: 'center', paddingHorizontal: 20, lineHeight: 19 },
    label: { fontSize: 12, fontWeight: '700', color: c.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
    montoBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: '#E0D8C8',
      borderRadius: radios.md,
      paddingHorizontal: 14,
      height: 54,
    },
    montoSimbolo: { fontFamily: c.monoSemi, fontSize: 18, color: c.muted },
    montoInput: { flex: 1, fontFamily: c.monoSemi, fontSize: 20, color: c.text },
    boton: {
      backgroundColor: c.brand,
      borderRadius: radios.md,
      paddingVertical: 16,
      alignItems: 'center',
      marginTop: 4,
    },
    botonOff: { opacity: 0.5 },
    botonText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
    abiertaTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      alignSelf: 'flex-start',
      backgroundColor: '#E3EFE6',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    puntoVerde: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3C7A4E' },
    abiertaTagText: { fontSize: 12.5, fontWeight: '700', color: '#3C7A4E' },
    hero: { backgroundColor: c.brand, borderRadius: radios.xl, padding: 22 },
    heroLabel: {
      fontSize: 12.5,
      color: '#B8AF9C',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    heroMonto: { fontFamily: c.monoSemi, fontSize: 36, color: c.onBrand, letterSpacing: -1, marginTop: 8 },
    heroSub: { fontSize: 12.5, color: '#B8AF9C', marginTop: 8 },
    fila: { flexDirection: 'row', gap: 12 },
    kpi: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 16,
      alignItems: 'center',
    },
    kpiValor: { fontFamily: c.monoSemi, fontSize: 18, color: c.text },
    kpiLabel: { fontSize: 11.5, color: c.muted, fontWeight: '600', marginTop: 3 },
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
    vacio: { fontSize: 13.5, color: c.muted, paddingVertical: 18 },
    medioFila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
    },
    medioBorde: { borderBottomWidth: 1, borderBottomColor: c.border },
    medioNombre: { fontSize: 15, fontWeight: '600', color: c.text },
    medioTotal: { fontFamily: c.monoSemi, fontSize: 16, color: c.text },
    reportes: { flexDirection: 'row', gap: 12 },
    reporteBtn: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.lg,
      padding: 16,
      gap: 4,
    },
    reporteText: { fontSize: 14.5, fontWeight: '700', color: c.text, marginTop: 6 },
    reporteSub: { fontSize: 12, color: c.muted },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
      padding: 20,
    },
    cerrarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.brand,
      borderRadius: radios.md,
      paddingVertical: 16,
    },
    cerrarBtnText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
    modalFondo: { flex: 1, backgroundColor: 'rgba(33,29,23,0.45)', justifyContent: 'flex-end' },
    modalHoja: {
      backgroundColor: c.bg,
      borderTopLeftRadius: radios.xl,
      borderTopRightRadius: radios.xl,
      padding: 20,
      gap: 12,
    },
    modalBarra: { width: 40, height: 4, borderRadius: 2, backgroundColor: c.border, alignSelf: 'center' },
    modalTitulo: { fontSize: 20, fontWeight: '800', color: c.text },
    arqueoFila: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surfaceAlt,
      borderRadius: radios.md,
      padding: 14,
    },
    arqueoLabel: { fontSize: 14, color: c.muted, fontWeight: '600' },
    arqueoValor: { fontFamily: c.monoSemi, fontSize: 18, color: c.text },
    difCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: radios.md,
      padding: 14,
    },
    difOk: { backgroundColor: '#E3EFE6' },
    difFalta: { backgroundColor: '#F3DDDD' },
    difLabel: { fontSize: 14, fontWeight: '700', color: '#3C7A4E', textTransform: 'uppercase' },
    difLabelFalta: { color: '#B23B3B' },
    difValor: { fontFamily: c.monoSemi, fontSize: 18, color: '#3C7A4E' },
    modalAcciones: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalCancelar: {
      flex: 1,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    modalCancelarText: { color: c.text, fontSize: 15, fontWeight: '700' },
    modalConfirmar: {
      flex: 1.4,
      backgroundColor: c.brand,
      borderRadius: radios.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    modalConfirmarText: { color: c.onBrand, fontSize: 15, fontWeight: '700' },
  });
