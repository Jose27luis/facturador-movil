import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
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
import { fmtMonto } from '@/shared/format';
import { volver } from '@/shared/navegar';
import { SelectorFecha } from '@/shared/ui/selector-fecha';
import { DocumentoAnulable } from '@/features/resumenes/resumenes.types';
import { useAnular, useAnulables } from '@/features/resumenes/use-resumenes';

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

export default function AnularScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const hoy = hoyISO();

  const [fecha, setFecha] = useState(hoy);
  const [calOpen, setCalOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentoAnulable[] | null>(null);
  const [anulados, setAnulados] = useState<Record<number, string>>({});
  const [aAnular, setAAnular] = useState<DocumentoAnulable | null>(null);
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState<string | null>(null);

  const consultar = useAnulables();
  const anular = useAnular();

  const esHoy = fecha === hoy;
  const fechaTexto = useMemo(() => fechaLegible(fecha), [fecha]);

  function onConsultar() {
    setError(null);
    setDocs(null);
    consultar.mutate(fecha, {
      onSuccess: (res) => setDocs(res),
      onError: (err) => setError(err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  function confirmarAnulacion() {
    if (!aAnular || motivo.trim().length < 3) {
      return;
    }
    anular.mutate(
      { id: aAnular.id, motivo: motivo.trim() },
      {
        onSuccess: (res) => {
          setAnulados((prev) => ({ ...prev, [aAnular.id]: res.ticket }));
          setAAnular(null);
          setMotivo('');
        },
        onError: (err) => setError(err instanceof Error ? err.message : 'No se pudo anular.'),
      },
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Anular comprobantes</Text>
        <View style={styles.iconoBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={styles.avisoInfo}>
          <Ionicons name="warning-outline" size={18} color={c.warn} />
          <Text style={styles.avisoInfoText}>
            La anulación se envía a SUNAT y es irreversible. Solo aplica a comprobantes aceptados.
          </Text>
        </View>

        <Text style={styles.seccion}>Fecha de emisión</Text>
        <Pressable style={styles.fechaCard} onPress={() => setCalOpen(true)}>
          <Ionicons name="calendar-outline" size={20} color={c.accent} />
          <Text style={styles.fechaValor}>{fechaTexto}</Text>
          {esHoy ? <Text style={styles.fechaHoy}>Hoy</Text> : null}
          <View style={styles.flex} />
          <Ionicons name="chevron-down" size={18} color={c.faint} />
        </Pressable>

        <Pressable
          style={[styles.consultar, consultar.isPending && styles.botonOff]}
          onPress={onConsultar}
          disabled={consultar.isPending}
        >
          {consultar.isPending ? (
            <ActivityIndicator color={c.brand} />
          ) : (
            <Text style={styles.consultarText}>Consultar comprobantes</Text>
          )}
        </Pressable>

        {error ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoText}>{error}</Text>
          </View>
        ) : null}

        {docs ? (
          docs.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.vacio}>No hay comprobantes aceptados en esta fecha.</Text>
            </View>
          ) : (
            docs.map((d) => {
              const ticket = anulados[d.id];
              return (
                <View key={d.id} style={styles.fila}>
                  <View style={styles.filaInfo}>
                    <Text style={styles.numero}>
                      {d.tipo} · {d.numero}
                    </Text>
                    <Text style={styles.cliente} numberOfLines={1}>
                      {d.cliente || 'Sin cliente'}
                    </Text>
                    <Text style={styles.total}>{fmtMonto(d.total, d.moneda)}</Text>
                  </View>
                  {ticket ? (
                    <View style={styles.anuladoTag}>
                      <Ionicons name="checkmark-circle" size={16} color={c.ok} />
                      <Text style={styles.anuladoText}>Enviado</Text>
                    </View>
                  ) : (
                    <Pressable style={styles.anularBtn} onPress={() => setAAnular(d)}>
                      <Text style={styles.anularBtnText}>Anular</Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )
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
            setDocs(null);
            setCalOpen(false);
          }}
        />
      ) : null}

      <Modal visible={!!aAnular} transparent animationType="fade" onRequestClose={() => setAAnular(null)}>
        <Pressable style={styles.modalFondo} onPress={() => setAAnular(null)}>
          <Pressable style={styles.modalCard} onPress={() => undefined}>
            <Text style={styles.modalTitulo}>Anular {aAnular?.numero}</Text>
            <Text style={styles.modalSub}>Indica el motivo de la anulación (mínimo 3 caracteres).</Text>
            <TextInput
              style={styles.modalInput}
              value={motivo}
              onChangeText={setMotivo}
              autoFocus
              multiline
              accessibilityLabel="Motivo de anulación"
            />
            <View style={styles.modalAcciones}>
              <Pressable style={styles.modalCancelar} onPress={() => setAAnular(null)}>
                <Text style={styles.modalCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.modalConfirmar, (motivo.trim().length < 3 || anular.isPending) && styles.botonOff]}
                onPress={confirmarAnulacion}
                disabled={motivo.trim().length < 3 || anular.isPending}
              >
                {anular.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmarText}>Anular comprobante</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const crear = (c: Tema) =>
  StyleSheet.create({
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
  content: { padding: 20, gap: 12 },
  avisoInfo: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-start',
    backgroundColor: '#F4EAD4',
    borderRadius: radios.md,
    padding: 13,
  },
  avisoInfoText: { flex: 1, fontSize: 12.5, color: '#8A6A2E', lineHeight: 18 },
  seccion: { fontSize: 13, fontWeight: '700', color: c.muted },
  fechaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    paddingHorizontal: 14,
    height: 52,
  },
  fechaValor: { fontFamily: c.monoSemi, fontSize: 16, color: c.text },
  fechaHoy: { fontSize: 12, color: c.accent, fontWeight: '700' },
  consultar: {
    borderWidth: 1,
    borderColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  consultarText: { color: c.brand, fontSize: 15, fontWeight: '700' },
  botonOff: { opacity: 0.5 },
  aviso: { backgroundColor: '#F3DDDD', borderRadius: radios.md, padding: 14 },
  avisoText: { color: c.danger, fontSize: 14 },
  card: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radios.lg, padding: 16 },
  vacio: { fontSize: 14, color: c.muted },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    padding: 14,
  },
  filaInfo: { flex: 1, minWidth: 0 },
  numero: { fontFamily: c.mono, fontSize: 13, color: c.text },
  cliente: { fontSize: 13, color: c.muted, marginTop: 2 },
  total: { fontFamily: c.monoSemi, fontSize: 14, color: c.text, marginTop: 2 },
  anularBtn: {
    borderWidth: 1,
    borderColor: c.danger,
    borderRadius: radios.sm,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  anularBtnText: { color: c.danger, fontSize: 14, fontWeight: '700' },
  anuladoTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  anuladoText: { color: c.ok, fontSize: 13, fontWeight: '700' },
  modalFondo: {
    flex: 1,
    backgroundColor: 'rgba(33,29,23,0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: c.surface, borderRadius: radios.xl, padding: 20, gap: 10 },
  modalTitulo: { fontSize: 17, fontWeight: '800', color: c.text },
  modalSub: { fontSize: 13, color: c.muted },
  modalInput: {
    backgroundColor: c.bg,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    padding: 14,
    fontSize: 15,
    color: c.text,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  modalAcciones: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCancelarText: { color: c.text, fontSize: 15, fontWeight: '700' },
  modalConfirmar: {
    flex: 1.4,
    backgroundColor: c.danger,
    borderRadius: radios.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalConfirmarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
