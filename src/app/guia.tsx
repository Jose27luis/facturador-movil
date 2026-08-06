import { useEffect, useRef, useState } from 'react';
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
import { volver } from '@/shared/navegar';
import { useAlturaTeclado } from '@/shared/usar-teclado';
import { VisorPdf } from '@/shared/ui/visor-pdf';
import {
  Conductor,
  GuiaResultado,
  MODALIDAD_PRIVADO,
  MODALIDAD_PUBLICO,
  Vehiculo,
} from '@/features/guias/guias.types';
import { useCatalogosGuia, useCrearGuia, useDatosGuia } from '@/features/guias/use-guias';

function hoy(): string {
  return new Date().toISOString().slice(0, 10);
}

function aNumero(valor: string): number {
  const n = Number(valor.replace(',', '.'));
  return Number.isNaN(n) ? 0 : n;
}

export default function GuiaScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const insets = useSafeAreaInsets();
  const alturaTeclado = useAlturaTeclado();
  const params = useLocalSearchParams<{ id: string }>();
  const idNum = Number(params.id);

  const catalogos = useCatalogosGuia();
  const datos = useDatosGuia(idNum);
  const crearGuia = useCrearGuia();
  const enviando = useRef(false);

  const [motivoId, setMotivoId] = useState('01');
  const [modalidadId, setModalidadId] = useState(MODALIDAD_PRIVADO);
  const [fechaTraslado, setFechaTraslado] = useState(hoy());
  const [origenDireccion, setOrigenDireccion] = useState('');
  const [destinoDireccion, setDestinoDireccion] = useState('');
  const [peso, setPeso] = useState('');
  const [bultos, setBultos] = useState('1');
  const [observaciones, setObservaciones] = useState('');
  const [conductorId, setConductorId] = useState<number | null>(null);
  const [vehiculoId, setVehiculoId] = useState<number | null>(null);
  const [transportistaNumero, setTransportistaNumero] = useState('');
  const [transportistaNombre, setTransportistaNombre] = useState('');
  const [resultado, setResultado] = useState<GuiaResultado | null>(null);

  const cat = catalogos.data;
  const doc = datos.data;

  useEffect(() => {
    if (cat && origenDireccion === '') {
      setOrigenDireccion(cat.origenDireccion);
    }
  }, [cat, origenDireccion]);

  useEffect(() => {
    if (doc && destinoDireccion === '' && doc.clienteDireccion) {
      setDestinoDireccion(doc.clienteDireccion);
    }
  }, [doc, destinoDireccion]);

  useEffect(() => {
    if (cat && conductorId === null && cat.conductores.length > 0) {
      setConductorId(cat.conductores[0].id);
    }
    if (cat && vehiculoId === null && cat.vehiculos.length > 0) {
      setVehiculoId(cat.vehiculos[0].id);
    }
  }, [cat, conductorId, vehiculoId]);

  const esPrivado = modalidadId === MODALIDAD_PRIVADO;
  const ubigeoOrigen = cat?.origenUbigeo ?? '';
  const ubigeoDestino = doc?.clienteUbigeo || ubigeoOrigen;

  const faltaTransporte = esPrivado
    ? conductorId === null || vehiculoId === null
    : transportistaNumero.trim().length !== 11 || transportistaNombre.trim() === '';

  const puedeEmitir =
    !crearGuia.isPending &&
    origenDireccion.trim() !== '' &&
    destinoDireccion.trim() !== '' &&
    ubigeoOrigen !== '' &&
    ubigeoDestino !== '' &&
    aNumero(peso) > 0 &&
    !faltaTransporte;

  function emitir() {
    if (!puedeEmitir || enviando.current) {
      return;
    }
    enviando.current = true;
    crearGuia.mutate(
      {
        documentId: idNum,
        motivoId,
        modalidadId,
        fechaTraslado,
        origenDireccion: origenDireccion.trim(),
        origenUbigeo: ubigeoOrigen,
        destinoDireccion: destinoDireccion.trim(),
        destinoUbigeo: ubigeoDestino,
        pesoTotal: aNumero(peso),
        bultos: Math.max(0, Math.trunc(aNumero(bultos))),
        observaciones: observaciones.trim() || undefined,
        conductorId: esPrivado && conductorId !== null ? conductorId : undefined,
        vehiculoId: esPrivado && vehiculoId !== null ? vehiculoId : undefined,
        transportistaNumero: esPrivado ? undefined : transportistaNumero.trim(),
        transportistaNombre: esPrivado ? undefined : transportistaNombre.trim(),
      },
      {
        onSuccess: (res) => {
          if (res.enviado) {
            setResultado(res);
            return;
          }
          Alert.alert('Guía generada', res.mensaje, [{ text: 'Ver guía', onPress: () => setResultado(res) }]);
        },
        onError: (err) =>
          Alert.alert('No se pudo generar', err instanceof Error ? err.message : 'Error desconocido'),
        onSettled: () => {
          enviando.current = false;
        },
      },
    );
  }

  function confirmar() {
    Alert.alert(
      'Generar guía de remisión',
      'Se emitirá la guía y se enviará a SUNAT junto con el comprobante como referencia.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Generar', onPress: emitir },
      ],
    );
  }

  if (catalogos.isLoading || datos.isLoading) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <ActivityIndicator color={c.brand} style={styles.carga} />
      </SafeAreaView>
    );
  }

  if (catalogos.isError || datos.isError) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
            <Ionicons name="chevron-back" size={24} color={c.text} />
          </Pressable>
          <Text style={styles.headerTitulo}>Guía de remisión</Text>
          <View style={styles.iconoBtn} />
        </View>
        <Text style={styles.vacio}>No se pudieron cargar los datos de la guía.</Text>
      </SafeAreaView>
    );
  }

  const sinSerie = (cat?.series.length ?? 0) === 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Guía de remisión</Text>
        <View style={styles.iconoBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + alturaTeclado + 28 }]}
      >
        <View style={styles.afectado}>
          <Text style={styles.afectadoLabel}>Comprobante de referencia</Text>
          <Text style={styles.afectadoNumero}>{doc?.numero ?? '—'}</Text>
          <Text style={styles.afectadoCliente}>{doc?.clienteNombre ?? ''}</Text>
        </View>

        {sinSerie ? (
          <View style={styles.aviso}>
            <Ionicons name="warning-outline" size={18} color={c.warn} />
            <Text style={styles.avisoText}>
              No hay una serie de guía configurada para tu establecimiento.
            </Text>
          </View>
        ) : null}

        <Text style={styles.seccion}>Motivo del traslado</Text>
        <View style={styles.chips}>
          {(cat?.motivos ?? []).map((m) => {
            const activo = motivoId === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.chip, activo && styles.chipOn]}
                onPress={() => setMotivoId(m.id)}
              >
                <Text style={[styles.chipText, activo && styles.chipTextOn]}>{m.descripcion}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.seccion}>Fecha de traslado</Text>
        <TextInput
          style={styles.input}
          value={fechaTraslado}
          onChangeText={setFechaTraslado}
          placeholder=""
          accessibilityLabel="Fecha de traslado"
        />

        <Text style={styles.seccion}>Punto de partida</Text>
        <TextInput
          style={styles.input}
          value={origenDireccion}
          onChangeText={setOrigenDireccion}
          accessibilityLabel="Dirección de partida"
        />

        <Text style={styles.seccion}>Punto de llegada</Text>
        <TextInput
          style={styles.input}
          value={destinoDireccion}
          onChangeText={setDestinoDireccion}
          accessibilityLabel="Dirección de llegada"
        />

        <View style={styles.fila}>
          <View style={styles.filaCampo}>
            <Text style={styles.seccion}>Peso total (kg)</Text>
            <TextInput
              style={styles.input}
              value={peso}
              onChangeText={setPeso}
              keyboardType="decimal-pad"
              accessibilityLabel="Peso total en kilogramos"
            />
          </View>
          <View style={styles.filaCampo}>
            <Text style={styles.seccion}>Bultos</Text>
            <TextInput
              style={styles.input}
              value={bultos}
              onChangeText={setBultos}
              keyboardType="number-pad"
              accessibilityLabel="Número de bultos"
            />
          </View>
        </View>

        <Text style={styles.seccion}>Transporte</Text>
        <View style={styles.chips}>
          {(cat?.modalidades ?? []).map((m) => {
            const activo = modalidadId === m.id;
            return (
              <Pressable
                key={m.id}
                style={[styles.chip, activo && styles.chipOn]}
                onPress={() => setModalidadId(m.id)}
              >
                <Text style={[styles.chipText, activo && styles.chipTextOn]}>{m.descripcion}</Text>
              </Pressable>
            );
          })}
        </View>

        {esPrivado ? (
          <>
            <Text style={styles.subseccion}>Conductor</Text>
            {(cat?.conductores ?? []).length === 0 ? (
              <Text style={styles.vacioLinea}>
                No hay conductores registrados. Regístralos en el facturador web.
              </Text>
            ) : (
              (cat?.conductores ?? []).map((d: Conductor) => {
                const activo = conductorId === d.id;
                return (
                  <Pressable
                    key={d.id}
                    style={[styles.opcion, activo && styles.opcionOn]}
                    onPress={() => setConductorId(d.id)}
                  >
                    <View style={styles.opcionInfo}>
                      <Text style={styles.opcionTitulo}>{d.nombre}</Text>
                      <Text style={styles.opcionDetalle}>
                        DNI {d.numero} · Licencia {d.licencia}
                      </Text>
                    </View>
                    {activo ? <Ionicons name="checkmark-circle" size={22} color={c.brand} /> : null}
                  </Pressable>
                );
              })
            )}

            <Text style={styles.subseccion}>Vehículo</Text>
            {(cat?.vehiculos ?? []).length === 0 ? (
              <Text style={styles.vacioLinea}>
                No hay vehículos registrados. Regístralos en el facturador web.
              </Text>
            ) : (
              (cat?.vehiculos ?? []).map((v: Vehiculo) => {
                const activo = vehiculoId === v.id;
                return (
                  <Pressable
                    key={v.id}
                    style={[styles.opcion, activo && styles.opcionOn]}
                    onPress={() => setVehiculoId(v.id)}
                  >
                    <View style={styles.opcionInfo}>
                      <Text style={styles.opcionTitulo}>{v.placa}</Text>
                      <Text style={styles.opcionDetalle}>
                        {v.marca} {v.modelo}
                      </Text>
                    </View>
                    {activo ? <Ionicons name="checkmark-circle" size={22} color={c.brand} /> : null}
                  </Pressable>
                );
              })
            )}
          </>
        ) : (
          <>
            <Text style={styles.subseccion}>RUC del transportista</Text>
            <TextInput
              style={styles.input}
              value={transportistaNumero}
              onChangeText={setTransportistaNumero}
              keyboardType="number-pad"
              maxLength={11}
              accessibilityLabel="RUC del transportista"
            />
            <Text style={styles.subseccion}>Razón social del transportista</Text>
            <TextInput
              style={styles.input}
              value={transportistaNombre}
              onChangeText={setTransportistaNombre}
              accessibilityLabel="Razón social del transportista"
            />
          </>
        )}

        <Text style={styles.seccion}>Observaciones</Text>
        <TextInput
          style={styles.input}
          value={observaciones}
          onChangeText={setObservaciones}
          accessibilityLabel="Observaciones"
        />

        <Text style={styles.seccion}>Productos a trasladar</Text>
        {(doc?.items ?? []).map((it, i) => (
          <View key={`${it.itemId}-${i}`} style={styles.item}>
            <Text style={styles.itemNombre} numberOfLines={2}>
              {it.descripcion}
            </Text>
            <Text style={styles.itemCantidad}>
              {it.cantidad} {it.unidad}
            </Text>
          </View>
        ))}

        <Pressable
          style={[styles.emitir, !puedeEmitir && styles.emitirOff]}
          onPress={confirmar}
          disabled={!puedeEmitir}
        >
          {crearGuia.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send-outline" size={19} color="#FFFFFF" />
              <Text style={styles.emitirText}>Generar y enviar a SUNAT</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {resultado ? (
        <VisorPdf
          visible
          numero={resultado.numero}
          a4Url={resultado.pdfUrl}
          ticketUrl=""
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
    headerTitulo: { fontSize: 17, fontWeight: '700', color: c.text },
    carga: { marginTop: 60 },
    vacio: { textAlign: 'center', color: c.muted, marginTop: 40, fontSize: 14 },
    vacioLinea: { color: c.muted, fontSize: 13.5, paddingVertical: 6 },
    content: { paddingHorizontal: 20, paddingTop: 4, gap: 6 },
    afectado: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      padding: 14,
      marginBottom: 6,
    },
    afectadoLabel: { fontSize: 12, fontWeight: '700', color: c.muted, textTransform: 'uppercase' },
    afectadoNumero: { fontFamily: c.monoSemi, fontSize: 17, color: c.text, marginTop: 4 },
    afectadoCliente: { fontSize: 13.5, color: c.muted, marginTop: 2 },
    aviso: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: c.accentSoft,
      borderWidth: 1,
      borderColor: c.accentBorder,
      borderRadius: radios.md,
      padding: 12,
      marginBottom: 4,
    },
    avisoText: { flex: 1, fontSize: 13, color: c.accentText },
    seccion: {
      fontSize: 12.5,
      fontWeight: '700',
      color: c.muted,
      textTransform: 'uppercase',
      marginTop: 12,
      marginBottom: 4,
    },
    subseccion: { fontSize: 13, fontWeight: '700', color: c.text, marginTop: 12, marginBottom: 4 },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      paddingHorizontal: 14,
      height: 50,
      fontSize: 15,
      color: c.text,
    },
    fila: { flexDirection: 'row', gap: 12 },
    filaCampo: { flex: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipOn: { backgroundColor: c.brand, borderColor: c.brand },
    chipText: { fontSize: 13, fontWeight: '600', color: c.text },
    chipTextOn: { color: c.onBrand },
    opcion: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      padding: 13,
      marginBottom: 8,
    },
    opcionOn: { borderColor: c.brand },
    opcionInfo: { flex: 1, marginRight: 8 },
    opcionTitulo: { fontSize: 14.5, fontWeight: '600', color: c.text },
    opcionDetalle: { fontSize: 12.5, color: c.muted, marginTop: 2 },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radios.md,
      padding: 12,
      marginBottom: 8,
    },
    itemNombre: { flex: 1, fontSize: 14, color: c.text, marginRight: 10 },
    itemCantidad: { fontFamily: c.monoSemi, fontSize: 13.5, color: c.muted },
    emitir: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: c.brand,
      borderRadius: radios.md,
      paddingVertical: 16,
      marginTop: 20,
    },
    emitirOff: { opacity: 0.5 },
    emitirText: { color: '#FFFFFF', fontSize: 15.5, fontWeight: '700' },
  });
