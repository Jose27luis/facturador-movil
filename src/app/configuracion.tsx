import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { volver } from '@/shared/navegar';
import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { Impresora, usePrinter } from '@/core/printer/printer-store';
import {
  activarBluetooth,
  imprimirPrueba,
  listarEmparejadas,
  pedirPermisos,
} from '@/core/printer/printer';

export default function ConfiguracionScreen() {
  const router = useRouter();
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const { activa, autoImprimir, hidratar, hidratado, guardar, setAuto } = usePrinter();

  const [dispositivos, setDispositivos] = useState<Impresora[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [probando, setProbando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hidratado) {
      void hidratar();
    }
  }, [hidratado, hidratar]);

  async function buscar() {
    setError(null);
    setBuscando(true);
    try {
      const ok = await pedirPermisos();
      if (!ok) {
        setError('Faltan permisos de Bluetooth.');
        return;
      }
      await activarBluetooth();
      setDispositivos(await listarEmparejadas());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo activar el Bluetooth.');
    } finally {
      setBuscando(false);
    }
  }

  async function probar() {
    if (!activa) {
      return;
    }
    setProbando(true);
    try {
      await imprimirPrueba(activa);
      Alert.alert('Prueba enviada', 'Revisa la impresora.');
    } catch (e) {
      Alert.alert('No se pudo imprimir', e instanceof Error ? e.message : 'Error desconocido');
    } finally {
      setProbando(false);
    }
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Configuración</Text>
        <View style={styles.iconoBtn} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable style={styles.linkPerso} onPress={() => router.push('/personalizacion')}>
          <View style={styles.linkIcono}>
            <Ionicons name="color-palette-outline" size={20} color={c.brand} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.linkTitulo}>Personalización</Text>
            <Text style={styles.linkSub}>Colores, fondo y fuente de la app.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.faint} />
        </Pressable>

        <Text style={styles.bloque}>Impresora</Text>

        <View style={styles.cardAuto}>
          <View style={styles.flex}>
            <Text style={styles.autoTitulo}>Imprimir automático al emitir</Text>
            <Text style={styles.autoSub}>Imprime el ticket apenas se genera la venta.</Text>
          </View>
          <Switch
            value={autoImprimir}
            onValueChange={(v) => void setAuto(v)}
            trackColor={{ true: c.brand, false: c.border }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.seccionFila}>
          <Text style={styles.seccion}>Impresoras emparejadas</Text>
          <Pressable style={styles.buscar} onPress={() => void buscar()} disabled={buscando}>
            {buscando ? (
              <ActivityIndicator color={c.brand} size="small" />
            ) : (
              <>
                <Ionicons name="bluetooth" size={16} color={c.brand} />
                <Text style={styles.buscarText}>Buscar</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={styles.ayuda}>
          Empareja la impresora desde los ajustes Bluetooth de Android y luego tócala aquí para usarla.
        </Text>

        {error ? (
          <View style={styles.aviso}>
            <Text style={styles.avisoText}>{error}</Text>
          </View>
        ) : null}

        {dispositivos.length === 0 ? (
          <Text style={styles.vacio}>Toca “Buscar” para ver las impresoras emparejadas.</Text>
        ) : (
          dispositivos.map((d) => {
            const seleccionada = d.direccion === activa;
            return (
              <Pressable
                key={d.direccion}
                style={[styles.disp, seleccionada && styles.dispOn]}
                onPress={() => void guardar(d)}
              >
                <Ionicons
                  name={seleccionada ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={seleccionada ? c.brand : c.faint}
                />
                <View style={styles.flex}>
                  <Text style={styles.dispNombre}>{d.nombre}</Text>
                  <Text style={styles.dispDir}>{d.direccion}</Text>
                </View>
                {seleccionada ? <Text style={styles.activaTag}>Activa</Text> : null}
              </Pressable>
            );
          })
        )}

        {activa ? (
          <Pressable style={[styles.prueba, probando && styles.pruebaOff]} onPress={() => void probar()} disabled={probando}>
            {probando ? (
              <ActivityIndicator color={c.onBrand} />
            ) : (
              <Text style={styles.pruebaText}>Prueba de impresión</Text>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
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
    headerTitulo: { fontSize: 16, fontWeight: '700', color: c.text, fontFamily: c.sansBold },
    content: { padding: 20, gap: 14 },
    linkPerso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.lg,
      padding: 14,
    },
    linkIcono: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
    },
    linkTitulo: { fontSize: 15, fontWeight: '700', color: c.text, fontFamily: c.sansBold },
    linkSub: { fontSize: 12.5, color: c.muted, marginTop: 2, fontFamily: c.sans },
    bloque: {
      fontSize: 13,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginTop: 8,
      fontFamily: c.sansBold,
    },
    cardAuto: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.lg,
      padding: 16,
    },
    autoTitulo: { fontSize: 15, fontWeight: '700', color: c.text, fontFamily: c.sansBold },
    autoSub: { fontSize: 12.5, color: c.muted, marginTop: 2, fontFamily: c.sans },
    seccionFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
    seccion: { fontSize: 13, fontWeight: '700', color: c.muted, textTransform: 'uppercase', letterSpacing: 0.4, fontFamily: c.sansBold },
    buscar: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    buscarText: { fontSize: 14, fontWeight: '700', color: c.brand, fontFamily: c.sansBold },
    ayuda: { fontSize: 12.5, color: c.muted, lineHeight: 18, fontFamily: c.sans },
    aviso: { backgroundColor: '#F3DDDD', borderRadius: radios.md, padding: 14 },
    avisoText: { color: c.danger, fontSize: 14, fontFamily: c.sans },
    vacio: { fontSize: 13.5, color: c.faint, paddingVertical: 14, fontFamily: c.sans },
    disp: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      padding: 14,
    },
    dispOn: { borderColor: c.brand },
    dispNombre: { fontSize: 15, fontWeight: '600', color: c.text, fontFamily: c.sans },
    dispDir: { fontSize: 12, color: c.faint, marginTop: 2, fontFamily: c.mono },
    activaTag: { fontSize: 12, fontWeight: '700', color: c.brand, fontFamily: c.sansBold },
    prueba: {
      backgroundColor: c.brand,
      borderRadius: radios.md,
      paddingVertical: 15,
      alignItems: 'center',
      marginTop: 8,
    },
    pruebaOff: { opacity: 0.6 },
    pruebaText: { color: c.onBrand, fontSize: 15, fontWeight: '700', fontFamily: c.sansBold },
  });
