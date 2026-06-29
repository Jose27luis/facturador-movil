import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { volver } from '@/shared/navegar';
import {
  COLORES_FONDO,
  COLORES_PRINCIPAL,
  COLORES_TEXTO,
  FuenteId,
  PRESETS,
} from '@/core/theme/palette';
import { useTemaStore } from '@/core/theme/tema-store';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';

const FUENTES: { id: FuenteId; etiqueta: string }[] = [
  { id: 'sistema', etiqueta: 'Sistema' },
  { id: 'inter', etiqueta: 'Inter' },
  { id: 'poppins', etiqueta: 'Poppins' },
  { id: 'mono', etiqueta: 'Mono' },
];

export default function PersonalizacionScreen() {
  const insets = useSafeAreaInsets();
  const c = useTema();
  const styles = useEstilos(crear);
  const config = useTemaStore((s) => s.config);
  const actualizar = useTemaStore((s) => s.actualizar);
  const restaurar = useTemaStore((s) => s.restaurar);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Personalización</Text>
        <Pressable onPress={() => void restaurar()} accessibilityLabel="Restaurar">
          <Text style={styles.restaurar}>Restaurar</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.preview}>
          <Text style={styles.previewTitulo}>Vista previa</Text>
          <Text style={styles.previewTexto}>Así se verá tu app, {''}</Text>
          <Text style={styles.previewMonto}>S/ 1,234.00</Text>
          <View style={styles.previewBtn}>
            <Text style={styles.previewBtnText}>Botón principal</Text>
          </View>
        </View>

        <Text style={styles.seccion}>Temas listos</Text>
        <View style={styles.presets}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.id}
              style={styles.preset}
              onPress={() => void actualizar(p.config)}
            >
              <View style={[styles.presetMuestra, { backgroundColor: p.config.fondo }]}>
                <View style={[styles.presetPunto, { backgroundColor: p.config.principal }]} />
              </View>
              <Text style={styles.presetNombre}>{p.nombre}</Text>
            </Pressable>
          ))}
        </View>

        <Selector
          titulo="Fondo"
          colores={COLORES_FONDO}
          activo={config.fondo}
          onElegir={(v) => void actualizar({ fondo: v })}
          styles={styles}
        />
        <Selector
          titulo="Color principal"
          colores={COLORES_PRINCIPAL}
          activo={config.principal}
          onElegir={(v) => void actualizar({ principal: v })}
          styles={styles}
        />
        <Selector
          titulo="Color de texto"
          colores={COLORES_TEXTO}
          activo={config.texto}
          onElegir={(v) => void actualizar({ texto: v })}
          styles={styles}
        />

        <Text style={styles.seccion}>Fuente</Text>
        <View style={styles.fuentes}>
          {FUENTES.map((f) => {
            const on = config.fuente === f.id;
            return (
              <Pressable
                key={f.id}
                style={[styles.fuente, on && styles.fuenteOn]}
                onPress={() => void actualizar({ fuente: f.id })}
              >
                <Text style={[styles.fuenteText, on && styles.fuenteTextOn]}>{f.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Selector({
  titulo,
  colores,
  activo,
  onElegir,
  styles,
}: {
  titulo: string;
  colores: string[];
  activo: string;
  onElegir: (v: string) => void;
  styles: ReturnType<typeof crear>;
}) {
  return (
    <>
      <Text style={styles.seccion}>{titulo}</Text>
      <View style={styles.swatches}>
        {colores.map((color) => {
          const on = color.toLowerCase() === activo.toLowerCase();
          return (
            <Pressable key={color} onPress={() => onElegir(color)}>
              <View style={[styles.swatch, { backgroundColor: color }, on && styles.swatchOn]}>
                {on ? <Ionicons name="checkmark" size={18} color={esClaro(color) ? '#211D17' : '#FFFFFF'} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

function esClaro(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 >= 0.6;
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
    headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text, fontFamily: c.sansBold },
    restaurar: { fontSize: 14, fontWeight: '700', color: c.brand, fontFamily: c.sansBold, paddingHorizontal: 8 },
    content: { padding: 20, gap: 12 },
    preview: {
      backgroundColor: c.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.border,
      padding: 18,
      gap: 6,
    },
    previewTitulo: {
      fontSize: 12,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      fontFamily: c.sansBold,
    },
    previewTexto: { fontSize: 16, color: c.text, fontFamily: c.sans },
    previewMonto: { fontFamily: c.monoSemi, fontSize: 26, color: c.text },
    previewBtn: {
      backgroundColor: c.brand,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
      marginTop: 6,
    },
    previewBtnText: { color: c.onBrand, fontSize: 15, fontWeight: '700', fontFamily: c.sansBold },
    seccion: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 8,
      fontFamily: c.sansBold,
    },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    preset: { alignItems: 'center', gap: 6, width: 64 },
    presetMuestra: {
      width: 54,
      height: 54,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    presetPunto: { width: 22, height: 22, borderRadius: 11 },
    presetNombre: { fontSize: 12, color: c.text, fontFamily: c.sans },
    swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatch: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    swatchOn: { borderWidth: 3, borderColor: c.brand },
    fuentes: { flexDirection: 'row', gap: 8 },
    fuente: {
      flex: 1,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: 999,
      paddingVertical: 11,
      alignItems: 'center',
    },
    fuenteOn: { backgroundColor: c.brand, borderColor: c.brand },
    fuenteText: { fontSize: 13.5, fontWeight: '600', color: c.text, fontFamily: c.sans },
    fuenteTextOn: { color: c.onBrand, fontFamily: c.sansBold },
  });
