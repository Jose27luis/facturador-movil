import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { paletaClara, radios } from '@/core/theme/tokens';
import { ResumenEnviado } from '@/features/resumenes/resumenes.types';
import { useConsultarResumen, useEnviarResumen } from '@/features/resumenes/use-resumenes';

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
  const [resumen, setResumen] = useState<ResumenEnviado | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const enviar = useEnviarResumen();
  const consultar = useConsultarResumen();

  const fecha = useMemo(() => fechaISO(offset), [offset]);

  function onEnviar() {
    setError(null);
    setEstado(null);
    setResumen(null);
    enviar.mutate(fecha, {
      onSuccess: (res) => setResumen(res),
      onError: (err) => setError(err instanceof Error ? err.message : 'Error desconocido'),
    });
  }

  function onConsultar() {
    if (!resumen) {
      return;
    }
    setError(null);
    consultar.mutate(resumen.ticket, {
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
          <Pressable
            style={styles.fechaBtn}
            onPress={() => setOffset((o) => o - 1)}
            accessibilityLabel="Día anterior"
          >
            <Ionicons name="chevron-back" size={22} color={c.text} />
          </Pressable>
          <View style={styles.fechaCentro}>
            <Text style={styles.fechaValor}>{fechaLegible(fecha)}</Text>
            {offset === 0 ? <Text style={styles.fechaHoy}>Hoy</Text> : null}
          </View>
          <Pressable
            style={[styles.fechaBtn, offset >= 0 && styles.fechaBtnOff]}
            onPress={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
            accessibilityLabel="Día siguiente"
          >
            <Ionicons name="chevron-forward" size={22} color={offset >= 0 ? c.faint : c.text} />
          </Pressable>
        </View>

        <Text style={styles.ayuda}>
          Se enviará a SUNAT el resumen de todas las boletas registradas en la fecha seleccionada.
        </Text>

        <Pressable
          style={[styles.accion, enviar.isPending && styles.accionOff]}
          onPress={onEnviar}
          disabled={enviar.isPending}
        >
          {enviar.isPending ? (
            <ActivityIndicator color={c.onBrand} />
          ) : (
            <Text style={styles.accionText}>Enviar resumen</Text>
          )}
        </Pressable>

        {error ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoText}>{error}</Text>
          </View>
        ) : null}

        {resumen ? (
          <View style={styles.card}>
            <Text style={styles.cardTitulo}>Resumen enviado</Text>
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
              style={[styles.consultar, consultar.isPending && styles.accionOff]}
              onPress={onConsultar}
              disabled={consultar.isPending}
            >
              {consultar.isPending ? (
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
  fechaValor: { fontSize: 18, fontWeight: '800', color: c.text },
  fechaHoy: { fontSize: 12, color: c.brand, fontWeight: '700', marginTop: 2 },
  ayuda: { fontSize: 13, color: c.muted, lineHeight: 18 },
  accion: {
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  accionOff: { opacity: 0.7 },
  accionText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
  aviso: {
    backgroundColor: '#F3DDDD',
    borderRadius: radios.md,
    padding: 14,
  },
  avisoText: { color: c.danger, fontSize: 14 },
  card: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.lg,
    padding: 16,
    gap: 10,
    marginTop: 4,
  },
  cardTitulo: { fontSize: 15, fontWeight: '800', color: c.text },
  dato: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  datoEtiqueta: { fontSize: 14, color: c.muted },
  datoValor: { fontSize: 14, fontWeight: '600', color: c.text, flexShrink: 1, textAlign: 'right', marginLeft: 12 },
  consultar: {
    borderWidth: 1,
    borderColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  consultarText: { color: c.brand, fontSize: 15, fontWeight: '700' },
});
