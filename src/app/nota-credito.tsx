import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
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
import { fmtMonto } from '@/shared/format';
import { volver } from '@/shared/navegar';
import { VisorPdf } from '@/shared/ui/visor-pdf';
import { NotaCreditoResultado, TIPOS_NOTA_CREDITO, TipoNotaCredito } from '@/features/notas/notas.types';
import { useCrearNotaCredito } from '@/features/notas/use-notas';

export default function NotaCreditoScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id: string; numero?: string; total?: string; moneda?: string }>();
  const idNum = Number(params.id);
  const total = params.total ? Number(params.total) : 0;
  const moneda = params.moneda || 'PEN';

  const [tipo, setTipo] = useState<TipoNotaCredito>('06');
  const [motivo, setMotivo] = useState('');
  const [resultado, setResultado] = useState<NotaCreditoResultado | null>(null);
  const enviando = useRef(false);
  const crearNota = useCrearNotaCredito();

  const puedeEmitir = motivo.trim().length >= 3 && !crearNota.isPending;

  function emitir() {
    if (!puedeEmitir || enviando.current || crearNota.isPending) {
      return;
    }
    enviando.current = true;
    crearNota.mutate(
      { documentId: idNum, tipo, motivo: motivo.trim() },
      {
        onSuccess: (res) => {
          if (res.pdfUrl) {
            setResultado(res);
          } else {
            Alert.alert('Nota de crédito emitida', `${res.numero}. ${res.mensaje}`, [
              { text: 'Listo', onPress: () => volver() },
            ]);
          }
        },
        onError: (err) =>
          Alert.alert('No se pudo emitir', err instanceof Error ? err.message : 'Error desconocido'),
        onSettled: () => {
          enviando.current = false;
        },
      },
    );
  }

  function confirmar() {
    Alert.alert(
      'Emitir nota de crédito',
      'Se enviará a SUNAT una nota de crédito sobre este comprobante. Esta acción es definitiva.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Emitir', onPress: emitir },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Nota de crédito</Text>
        <View style={styles.iconoBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.afectado}>
          <Text style={styles.afectadoLabel}>Comprobante afectado</Text>
          <Text style={styles.afectadoNumero}>{params.numero || '—'}</Text>
          <Text style={styles.afectadoTotal}>{fmtMonto(total, moneda)}</Text>
        </View>

        <View style={styles.aviso}>
          <Ionicons name="warning-outline" size={18} color={c.warn} />
          <Text style={styles.avisoText}>
            La nota de crédito se envía a SUNAT y deja constancia de la devolución o corrección.
          </Text>
        </View>

        <Text style={styles.seccion}>Tipo de nota</Text>
        {TIPOS_NOTA_CREDITO.map((op) => {
          const activo = tipo === op.id;
          return (
            <Pressable
              key={op.id}
              style={[styles.opcion, activo && styles.opcionOn]}
              onPress={() => setTipo(op.id)}
            >
              <View style={[styles.radio, activo && styles.radioOn]}>
                {activo ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.opcionInfo}>
                <Text style={styles.opcionTitulo}>{op.etiqueta}</Text>
                <Text style={styles.opcionDetalle}>{op.detalle}</Text>
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.seccion}>Motivo</Text>
        <TextInput
          style={styles.input}
          value={motivo}
          onChangeText={setMotivo}
          multiline
          accessibilityLabel="Motivo de la nota de crédito"
        />
        <Text style={styles.ayuda}>Mínimo 3 caracteres. Quedará registrado en el comprobante.</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <Pressable
          style={[styles.emitir, !puedeEmitir && styles.emitirOff]}
          onPress={confirmar}
          disabled={!puedeEmitir}
        >
          {crearNota.isPending ? (
            <ActivityIndicator color={c.onBrand} />
          ) : (
            <Text style={styles.emitirText}>Emitir nota de crédito</Text>
          )}
        </Pressable>
      </View>

      {resultado ? (
        <VisorPdf
          visible
          numero={resultado.numero}
          a4Url={resultado.pdfUrl}
          ticketUrl={resultado.pdfTicket}
          onCerrar={() => {
            setResultado(null);
            volver();
          }}
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
    headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text },
    content: { padding: 20, gap: 12 },
    afectado: {
      backgroundColor: c.surface,
      borderRadius: radios.lg,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
    },
    afectadoLabel: { fontSize: 12, color: c.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
    afectadoNumero: { fontFamily: c.monoSemi, fontSize: 20, color: c.text, marginTop: 6 },
    afectadoTotal: { fontFamily: c.monoSemi, fontSize: 26, color: c.text, marginTop: 4, letterSpacing: -0.5 },
    aviso: {
      flexDirection: 'row',
      gap: 10,
      backgroundColor: '#F4EAD4',
      borderRadius: radios.md,
      padding: 12,
      alignItems: 'flex-start',
    },
    avisoText: { flex: 1, fontSize: 13, color: '#8A6A2E', lineHeight: 18 },
    seccion: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 8,
    },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      padding: 14,
    },
    opcionOn: { borderColor: c.brand, backgroundColor: c.accentSoft },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOn: { borderColor: c.brand },
    radioDot: { width: 11, height: 11, borderRadius: 6, backgroundColor: c.brand },
    opcionInfo: { flex: 1 },
    opcionTitulo: { fontSize: 15, fontWeight: '700', color: c.text },
    opcionDetalle: { fontSize: 12.5, color: c.muted, marginTop: 2 },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: '#E0D8C8',
      borderRadius: radios.md,
      paddingHorizontal: 14,
      paddingVertical: 12,
      minHeight: 80,
      fontSize: 15,
      color: c.text,
      textAlignVertical: 'top',
    },
    ayuda: { fontSize: 12, color: c.muted },
    footer: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      backgroundColor: c.surface,
      padding: 20,
    },
    emitir: {
      backgroundColor: c.brand,
      borderRadius: radios.md,
      paddingVertical: 16,
      alignItems: 'center',
    },
    emitirOff: { opacity: 0.5 },
    emitirText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
  });
