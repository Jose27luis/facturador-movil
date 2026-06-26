import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { fuentes, paletaClara, radios } from '@/core/theme/tokens';
import { fmtMonto } from '@/shared/format';
import { PreviewResumen, ResumenEnviado } from '@/features/resumenes/resumenes.types';
import {
  useConsultarPreview,
  useConsultarResumen,
  useEnviarResumen,
} from '@/features/resumenes/use-resumenes';

const c = paletaClara;

function fechaISO(offsetDias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return d.toISOString().slice(0, 10);
}

function fechaLegible(iso: string): string {
  const [a, m, dia] = iso.split('-');
  return `${dia}/${m}/${a}`;
}

export default function ResumenesScreen() {
  const router = useRouter();
  const [offset, setOffset] = useState(0);
  const [preview, setPreview] = useState<PreviewResumen | null>(null);
  const [resumen, setResumen] = useState<ResumenEnviado | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const consultar = useConsultarPreview();
  const enviar = useEnviarResumen();
  const consultarEstado = useConsultarResumen();

  const fecha = useMemo(() => fechaISO(offset), [offset]);

  function cambiarFecha(delta: number) {
    setOffset((o) => Math.min(0, o + delta));
    setPreview(null);
    setResumen(null);
    setEstado(null);
    setError(null);
  }

  function onConsultar() {
    setError(null);
    setResumen(null);
    setEstado(null);
    consultar.mutate(fecha, {
      onSuccess: (res) => setPreview(res),
      onError: (err) => setError(err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  function onEnviar() {
    setError(null);
    enviar.mutate(fecha, {
      onSuccess: (res) => setResumen(res),
      onError: (err) => setError(err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  function onConsultarEstado() {
    if (!resumen) {
      return;
    }
    setError(null);
    consultarEstado.mutate(resumen.ticket, {
      onSuccess: (res) => setEstado(res.descripcion),
      onError: (err) => setError(err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => router.back()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Resumen diario de boletas</Text>
        <View style={styles.iconoBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.seccion}>Fecha de emisión</Text>
        <View style={styles.fechaCard}>
          <Pressable style={styles.fechaBtn} onPress={() => cambiarFecha(-1)} accessibilityLabel="Día anterior">
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </Pressable>
          <View style={styles.fechaCentro}>
            <Text style={styles.fechaValor}>{fechaLegible(fecha)}</Text>
            {offset === 0 ? <Text style={styles.fechaHoy}>Hoy</Text> : null}
          </View>
          <Pressable
            style={[styles.fechaBtn, offset >= 0 && styles.fechaBtnOff]}
            onPress={() => cambiarFecha(1)}
            disabled={offset >= 0}
            accessibilityLabel="Día siguiente"
          >
            <Ionicons name="chevron-forward" size={22} color={offset >= 0 ? c.faint : c.text} />
          </Pressable>
        </View>

        <Pressable
          style={[styles.consultar, consultar.isPending && styles.botonOff]}
          onPress={onConsultar}
          disabled={consultar.isPending}
        >
          {consultar.isPending ? (
            <ActivityIndicator color={c.brand} />
          ) : (
            <Text style={styles.consultarText}>Consultar boletas</Text>
          )}
        </Pressable>

        {error ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoText}>{error}</Text>
          </View>
        ) : null}

        {preview ? (
          preview.cantidad === 0 ? (
            <View style={styles.card}>
              <Text style={styles.vacio}>No hay boletas por resumir en esta fecha.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardTitulo}>
                {preview.cantidad} boleta{preview.cantidad === 1 ? '' : 's'} por enviar
              </Text>
              {preview.boletas.slice(0, 8).map((b, i) => (
                <View key={i} style={styles.boleta}>
                  <Text style={styles.boletaNum}>{b.numero}</Text>
                  <Text style={styles.boletaTotal}>{fmtMonto(b.total, b.moneda)}</Text>
                </View>
              ))}
              {preview.cantidad > 8 ? (
                <Text style={styles.boletaMas}>y {preview.cantidad - 8} más…</Text>
              ) : null}

              {resumen ? null : (
                <Pressable
                  style={[styles.enviar, enviar.isPending && styles.botonOff]}
                  onPress={onEnviar}
                  disabled={enviar.isPending}
                >
                  {enviar.isPending ? (
                    <ActivityIndicator color={c.onBrand} />
                  ) : (
                    <Text style={styles.enviarText}>Enviar resumen a SUNAT</Text>
                  )}
                </Pressable>
              )}
            </View>
          )
        ) : null}

        {resumen ? (
          <View style={styles.card}>
            <View style={styles.okFila}>
              <Ionicons name="checkmark-circle" size={22} color={c.ok} />
              <Text style={styles.okText}>Resumen enviado</Text>
            </View>
            <View style={styles.dato}>
              <Text style={styles.datoEtiqueta}>Ticket</Text>
              <Text style={styles.datoValor}>{resumen.ticket}</Text>
            </View>
            {estado ? (
              <View style={styles.dato}>
                <Text style={styles.datoEtiqueta}>Estado</Text>
                <Text style={styles.datoValor}>{estado}</Text>
              </View>
            ) : null}
            <Pressable
              style={[styles.consultar, consultarEstado.isPending && styles.botonOff]}
              onPress={onConsultarEstado}
              disabled={consultarEstado.isPending}
            >
              {consultarEstado.isPending ? (
                <ActivityIndicator color={c.brand} />
              ) : (
                <Text style={styles.consultarText}>Consultar estado</Text>
              )}
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  seccion: { fontSize: 13, fontWeight: '700', color: c.muted },
  fechaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    padding: 10,
  },
  fechaBtn: {
    width: 44,
    height: 44,
    borderRadius: radios.sm,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fechaBtnOff: { backgroundColor: c.bg },
  fechaCentro: { alignItems: 'center' },
  fechaValor: { fontFamily: fuentes.monoSemi, fontSize: 18, color: c.text },
  fechaHoy: { fontSize: 12, color: c.accent, fontWeight: '700', marginTop: 2 },
  consultar: {
    borderWidth: 1,
    borderColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  consultarText: { color: c.brand, fontSize: 15, fontWeight: '700' },
  botonOff: { opacity: 0.6 },
  aviso: { backgroundColor: '#F3DDDD', borderRadius: radios.md, padding: 14 },
  avisoText: { color: c.danger, fontSize: 14 },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.lg,
    padding: 16,
    gap: 8,
  },
  cardTitulo: { fontSize: 15, fontWeight: '800', color: c.text, marginBottom: 2 },
  vacio: { fontSize: 14, color: c.muted, paddingVertical: 6 },
  boleta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: c.surfaceAlt,
  },
  boletaNum: { fontFamily: fuentes.mono, fontSize: 13, color: c.text },
  boletaTotal: { fontFamily: fuentes.monoSemi, fontSize: 13, color: c.text },
  boletaMas: { fontSize: 12.5, color: c.muted, marginTop: 4 },
  enviar: {
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  enviarText: { color: c.onBrand, fontSize: 15, fontWeight: '700' },
  okFila: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  okText: { fontSize: 15, fontWeight: '800', color: c.ok },
  dato: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  datoEtiqueta: { fontSize: 14, color: c.muted },
  datoValor: { fontFamily: fuentes.mono, fontSize: 13.5, color: c.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
});
