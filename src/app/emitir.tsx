import { useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { volver } from '@/shared/navegar';

import { useSession } from '@/core/auth/session';
import { radios } from '@/core/theme/tokens';
import { Tema, useEstilos, useTema } from '@/core/theme/use-tema';
import { fmtMonto } from '@/shared/format';
import { VisorPdf } from '@/shared/ui/visor-pdf';
import { usePrinter } from '@/core/printer/printer-store';
import { imprimirTicket } from '@/core/printer/printer';
import { EmitirResultado } from '@/features/emitir/emitir.types';
import {
  ClienteBusqueda,
  ItemBusqueda,
  LineaCarrito,
  Serie,
  etiquetaTipo,
} from '@/features/emitir/emitir.types';
import {
  useBuscarClientes,
  useBuscarItems,
  useConsultarCliente,
  useEmitir,
  useSeries,
} from '@/features/emitir/use-emitir';

type MedioPago = 'efectivo' | 'tarjeta' | 'yape' | 'transferencia';

const MEDIOS: { id: MedioPago; etiqueta: string; icono: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'efectivo', etiqueta: 'Efectivo', icono: 'cash-outline' },
  { id: 'tarjeta', etiqueta: 'Tarjeta', icono: 'card-outline' },
  { id: 'yape', etiqueta: 'Yape/Plin', icono: 'phone-portrait-outline' },
  { id: 'transferencia', etiqueta: 'Transfer.', icono: 'swap-horizontal-outline' },
];

function aMonto(texto: string): number {
  const limpio = texto.replace(',', '.').replace(/[^0-9.]/g, '');
  const n = Number(limpio);
  return Number.isNaN(n) ? 0 : n;
}

export default function EmitirScreen() {
  const c = useTema();
  const styles = useEstilos(crear);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const usuario = useSession((s) => s.usuario);
  const impresoraActiva = usePrinter((s) => s.activa);
  const autoImprimir = usePrinter((s) => s.autoImprimir);
  const { data: series, isLoading: cargandoSeries } = useSeries();
  const emitir = useEmitir();

  const [serieId, setSerieId] = useState<number | null>(null);
  const [cliente, setCliente] = useState<ClienteBusqueda | null>(null);
  const [lineas, setLineas] = useState<LineaCarrito[]>([]);
  const [modalCliente, setModalCliente] = useState(false);
  const [modalItem, setModalItem] = useState(false);
  const [resultado, setResultado] = useState<EmitirResultado | null>(null);
  const [cobrarOpen, setCobrarOpen] = useState(false);
  const [descuento, setDescuento] = useState('');
  const [recibido, setRecibido] = useState('');
  const [medioPago, setMedioPago] = useState<MedioPago>('efectivo');
  const enviando = useRef(false);

  const serieSel = useMemo<Serie | undefined>(() => {
    if (!series || series.length === 0) {
      return undefined;
    }
    const elegida = series.find((s) => s.id === serieId);
    return elegida ?? series.find((s) => s.esDefault) ?? series[0];
  }, [series, serieId]);

  const total = lineas.reduce((acc, l) => acc + l.item.precio * l.cantidad, 0);
  const moneda = lineas[0]?.item.moneda ?? 'PEN';

  const descuentoNum = Math.min(aMonto(descuento), total);
  const totalPagar = Math.max(0, Math.round((total - descuentoNum) * 100) / 100);
  const factor = total > 0 ? totalPagar / total : 1;
  const recibidoNum = aMonto(recibido);
  const vuelto = Math.round((recibidoNum - totalPagar) * 100) / 100;

  function agregarItem(item: ItemBusqueda) {
    setLineas((prev) => {
      const idx = prev.findIndex((l) => l.item.id === item.id);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
        return copia;
      }
      return [...prev, { item, cantidad: 1 }];
    });
    setModalItem(false);
  }

  function cambiarCantidad(itemId: number, delta: number) {
    setLineas((prev) =>
      prev
        .map((l) => (l.item.id === itemId ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0),
    );
  }

  function confirmarEmision() {
    if (!serieSel || lineas.length === 0) {
      return;
    }
    if (enviando.current || emitir.isPending) {
      return;
    }
    enviando.current = true;
    const esNotaVenta = serieSel.tipoId === '80';
    const conDescuento = descuentoNum > 0;
    const precioFinal = (precio: number) => Math.round(precio * factor * 100) / 100;

    const imprimir = async (numero: string) => {
      if (!impresoraActiva || !autoImprimir || !serieSel) {
        return;
      }
      try {
        await imprimirTicket(impresoraActiva, {
          empresa: usuario?.nombre || 'Amantix',
          ruc: usuario?.ruc,
          tipo: etiquetaTipo(serieSel.tipoId),
          numero,
          fecha: new Date().toLocaleDateString('es-PE'),
          cliente: cliente?.descripcion || 'Cliente varios',
          items: lineas.map((l) => ({
            nombre: l.item.nombre,
            cantidad: l.cantidad,
            precio: precioFinal(l.item.precio),
            total: precioFinal(l.item.precio) * l.cantidad,
          })),
          total: totalPagar,
          moneda,
        });
      } catch {
        // si la impresion falla no se interrumpe la emision
      }
    };

    emitir.mutate(
      {
        payload: {
          series_id: serieSel.id,
          customer_id: cliente?.id,
          currency_type_id: moneda,
          items: lineas.map((l) => ({
            item_id: l.item.id,
            quantity: l.cantidad,
            ...(conDescuento ? { unit_price: precioFinal(l.item.precio) } : {}),
          })),
        },
        esNotaVenta,
      },
      {
        onSuccess: (res) => {
          setCobrarOpen(false);
          void imprimir(res.numero);
          if (res.pdfUrl) {
            setResultado(res);
          } else {
            Alert.alert('Comprobante emitido', res.numero, [
              { text: 'Listo', onPress: () => volver() },
            ]);
          }
        },
        onError: (err) => {
          Alert.alert('No se pudo emitir', err instanceof Error ? err.message : 'Error desconocido');
        },
        onSettled: () => {
          enviando.current = false;
        },
      },
    );
  }

  const puedeCobrar = !!serieSel && lineas.length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Pressable style={styles.iconoBtn} onPress={() => volver()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={24} color={c.text} />
        </Pressable>
        <Text style={styles.headerTitulo}>Emitir comprobante</Text>
        <View style={styles.iconoBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.seccion}>Comprobante</Text>
        {cargandoSeries ? (
          <ActivityIndicator color={c.brand} />
        ) : (
          <View style={styles.chips}>
            {series?.map((s) => {
              const activo = serieSel?.id === s.id;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.chip, activo && styles.chipActivo]}
                  onPress={() => setSerieId(s.id)}
                >
                  <Text style={[styles.chipText, activo && styles.chipTextActivo]}>
                    {etiquetaTipo(s.tipoId)} {s.numero}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={styles.seccion}>Cliente</Text>
        <Pressable style={styles.selector} onPress={() => setModalCliente(true)}>
          <Text style={styles.selectorValor} numberOfLines={1}>
            {cliente ? cliente.descripcion : 'Cliente varios'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={c.faint} />
        </Pressable>

        <View style={styles.seccionFila}>
          <Text style={styles.seccion}>Productos</Text>
          <Pressable style={styles.agregar} onPress={() => setModalItem(true)}>
            <Ionicons name="add" size={18} color={c.brand} />
            <Text style={styles.agregarText}>Agregar</Text>
          </Pressable>
        </View>

        {lineas.length === 0 ? (
          <Text style={styles.vacio}>Aún no agregaste productos.</Text>
        ) : (
          lineas.map((l) => (
            <View key={l.item.id} style={styles.linea}>
              <View style={styles.lineaInfo}>
                <Text style={styles.lineaNombre} numberOfLines={1}>
                  {l.item.nombre}
                </Text>
                <Text style={styles.lineaPrecio}>
                  {fmtMonto(l.item.precio, l.item.moneda)} c/u
                </Text>
              </View>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => cambiarCantidad(l.item.id, -1)}>
                  <Ionicons name="remove" size={18} color={c.text} />
                </Pressable>
                <Text style={styles.stepCant}>{l.cantidad}</Text>
                <Pressable style={styles.stepBtn} onPress={() => cambiarCantidad(l.item.id, 1)}>
                  <Ionicons name="add" size={18} color={c.text} />
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 14 }]}>
        <View style={styles.totalFila}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValor}>{fmtMonto(total, moneda)}</Text>
        </View>
        <Pressable
          style={[styles.emitirBtn, !puedeCobrar && styles.emitirBtnOff]}
          onPress={() => setCobrarOpen(true)}
          disabled={!puedeCobrar}
        >
          <Ionicons name="cash-outline" size={20} color={c.onBrand} />
          <Text style={styles.emitirText}>Cobrar</Text>
        </Pressable>
      </View>

      <ModalBuscarCliente
        visible={modalCliente}
        tipoId={serieSel?.tipoId ?? '03'}
        onCerrar={() => setModalCliente(false)}
        onElegir={(cl) => {
          setCliente(cl);
          setModalCliente(false);
        }}
        onVarios={() => {
          setCliente(null);
          setModalCliente(false);
        }}
      />
      <ModalBuscarItem
        visible={modalItem}
        onCerrar={() => setModalItem(false)}
        onElegir={agregarItem}
      />
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

      <Modal visible={cobrarOpen} animationType="slide" transparent onRequestClose={() => setCobrarOpen(false)}>
        <View style={styles.cobrarFondo}>
          <View style={[styles.cobrarHoja, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.cobrarBarra} />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.cobrarContent}>
              <Text style={styles.cobrarTitulo}>Cobrar</Text>

              <View style={styles.resumenFila}>
                <Text style={styles.resumenLabel}>Subtotal</Text>
                <Text style={styles.resumenValor}>{fmtMonto(total, moneda)}</Text>
              </View>

              <View style={styles.descFila}>
                <Text style={styles.resumenLabel}>Descuento</Text>
                <View style={styles.descInputBox}>
                  <Text style={styles.descSimbolo}>S/</Text>
                  <TextInput
                    style={styles.descInput}
                    value={descuento}
                    onChangeText={setDescuento}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Descuento"
                  />
                </View>
              </View>

              <View style={styles.totalPagarCard}>
                <Text style={styles.totalPagarLabel}>Total a pagar</Text>
                <Text style={styles.totalPagarValor}>{fmtMonto(totalPagar, moneda)}</Text>
              </View>

              <Text style={styles.cobrarSeccion}>Medio de pago</Text>
              <View style={styles.medios}>
                {MEDIOS.map((m) => {
                  const activo = medioPago === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      style={[styles.medio, activo && styles.medioOn]}
                      onPress={() => setMedioPago(m.id)}
                    >
                      <Ionicons name={m.icono} size={20} color={activo ? c.onBrand : c.text} />
                      <Text style={[styles.medioText, activo && styles.medioTextOn]}>{m.etiqueta}</Text>
                    </Pressable>
                  );
                })}
              </View>

              {medioPago === 'efectivo' ? (
                <>
                  <Text style={styles.cobrarSeccion}>Monto recibido</Text>
                  <View style={styles.descInputBox}>
                    <Text style={styles.descSimbolo}>S/</Text>
                    <TextInput
                      style={styles.descInput}
                      value={recibido}
                      onChangeText={setRecibido}
                      keyboardType="decimal-pad"
                      accessibilityLabel="Monto recibido"
                    />
                  </View>
                  {recibidoNum > 0 ? (
                    <View style={[styles.vueltoCard, vuelto < 0 && styles.vueltoFalta]}>
                      <Text style={styles.vueltoLabel}>{vuelto < 0 ? 'Falta' : 'Vuelto'}</Text>
                      <Text style={[styles.vueltoValor, vuelto < 0 && styles.vueltoValorFalta]}>
                        {fmtMonto(Math.abs(vuelto), moneda)}
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.rapidos}>
                    {[totalPagar, 20, 50, 100].map((m, i) => (
                      <Pressable key={i} style={styles.rapido} onPress={() => setRecibido(String(m))}>
                        <Text style={styles.rapidoText}>{i === 0 ? 'Exacto' : `S/ ${m}`}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
            </ScrollView>

            <View style={styles.cobrarAcciones}>
              <Pressable style={styles.cobrarCancelar} onPress={() => setCobrarOpen(false)}>
                <Text style={styles.cobrarCancelarText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.cobrarEmitir, emitir.isPending && styles.emitirBtnOff]}
                onPress={confirmarEmision}
                disabled={emitir.isPending}
              >
                {emitir.isPending ? (
                  <ActivityIndicator color={c.onBrand} />
                ) : (
                  <Text style={styles.cobrarEmitirText}>Emitir {fmtMonto(totalPagar, moneda)}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ModalBuscarCliente({
  visible,
  tipoId,
  onCerrar,
  onElegir,
  onVarios,
}: {
  visible: boolean;
  tipoId: string;
  onCerrar: () => void;
  onElegir: (cl: ClienteBusqueda) => void;
  onVarios: () => void;
}) {
  const c = useTema();
  const styles = useEstilos(crear);
  const [texto, setTexto] = useState('');
  const [nombreManual, setNombreManual] = useState('');
  const [pedirNombre, setPedirNombre] = useState(false);
  const { data, isFetching } = useBuscarClientes(texto, tipoId);
  const consulta = useConsultarCliente();

  const numero = texto.trim();
  const esDocumento = /^\d{8}$/.test(numero) || /^\d{11}$/.test(numero);

  function consultar(conNombre?: string) {
    consulta.mutate(
      { numero, nombre: conNombre },
      {
        onSuccess: (res) => {
          if (res.ok) {
            onElegir(res.cliente);
          } else if (res.needsName) {
            setPedirNombre(true);
          } else {
            Alert.alert('No se pudo consultar', res.message);
          }
        },
        onError: (err) =>
          Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo consultar.'),
      },
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.headerTitulo}>Cliente</Text>
          <Pressable onPress={onCerrar} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
        </View>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={(t) => {
            setTexto(t);
            setPedirNombre(false);
          }}
          autoFocus
          keyboardType="default"
          accessibilityLabel="Nombre, DNI o RUC"
        />

        <Pressable style={styles.varios} onPress={onVarios}>
          <Ionicons name="people-outline" size={20} color={c.text} />
          <View style={styles.variosInfo}>
            <Text style={styles.variosTitulo}>Cliente varios</Text>
            <Text style={styles.variosSub}>Venta rápida sin datos</Text>
          </View>
        </Pressable>

        {esDocumento ? (
          <View style={styles.consultaCard}>
            <Pressable
              style={[styles.consultaBtn, consulta.isPending && styles.consultaBtnOff]}
              onPress={() => consultar()}
              disabled={consulta.isPending}
            >
              {consulta.isPending ? (
                <ActivityIndicator color={c.onBrand} />
              ) : (
                <Text style={styles.consultaText}>
                  Consultar {numero.length === 11 ? 'RUC' : 'DNI'} {numero}
                </Text>
              )}
            </Pressable>
            {pedirNombre ? (
              <View style={styles.manualBox}>
                <Text style={styles.manualLabel}>No se encontró. Ingresa el nombre y regístralo:</Text>
                <TextInput
                  style={styles.inputManual}
                  value={nombreManual}
                  onChangeText={setNombreManual}
                  accessibilityLabel="Nombre del cliente"
                />
                <Pressable
                  style={[styles.consultaBtn, nombreManual.trim() === '' && styles.consultaBtnOff]}
                  onPress={() => consultar(nombreManual.trim())}
                  disabled={nombreManual.trim() === '' || consulta.isPending}
                >
                  <Text style={styles.consultaText}>Registrar cliente</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {isFetching ? (
          <ActivityIndicator color={c.brand} style={styles.modalCarga} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.modalLista}
            renderItem={({ item }) => (
              <Pressable style={styles.opcion} onPress={() => onElegir(item)}>
                <Text style={styles.opcionTitulo}>{item.nombre}</Text>
                <Text style={styles.opcionSub}>{item.numero}</Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

function ModalBuscarItem({
  visible,
  onCerrar,
  onElegir,
}: {
  visible: boolean;
  onCerrar: () => void;
  onElegir: (item: ItemBusqueda) => void;
}) {
  const c = useTema();
  const styles = useEstilos(crear);
  const [texto, setTexto] = useState('');
  const { data, isFetching } = useBuscarItems(texto);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.modalHeader}>
          <Text style={styles.headerTitulo}>Productos</Text>
          <Pressable onPress={onCerrar} accessibilityLabel="Cerrar">
            <Ionicons name="close" size={24} color={c.text} />
          </Pressable>
        </View>
        <View style={styles.buscadorModal}>
          <Ionicons name="search" size={17} color={c.faint} />
          <TextInput
            style={styles.inputBuscador}
            value={texto}
            onChangeText={setTexto}
            accessibilityLabel="Nombre o código del producto"
          />
        </View>
        {isFetching ? (
          <ActivityIndicator color={c.brand} style={styles.modalCarga} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.modalLista}
            renderItem={({ item }) => (
              <Pressable style={styles.opcion} onPress={() => onElegir(item)}>
                <Text style={styles.opcionTitulo} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.opcionSub}>
                  {fmtMonto(item.precio, item.moneda)} · stock {item.stock}
                </Text>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
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
  content: { padding: 20, paddingBottom: 40, gap: 10 },
  seccion: { fontSize: 13, fontWeight: '700', color: c.muted, marginTop: 8 },
  seccionFila: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  chipActivo: { backgroundColor: c.brand, borderColor: c.brand },
  chipText: { fontSize: 14, fontWeight: '600', color: c.text },
  chipTextActivo: { color: c.onBrand },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectorValor: { fontSize: 15, color: c.text, flex: 1, marginRight: 8 },
  selectorVacio: { fontSize: 15, color: c.faint, flex: 1, marginRight: 8 },
  agregar: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  agregarText: { fontSize: 14, fontWeight: '700', color: c.brand },
  vacio: { fontSize: 14, color: c.faint, paddingVertical: 12 },
  linea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    padding: 14,
  },
  lineaInfo: { flex: 1, marginRight: 12 },
  lineaNombre: { fontSize: 14, fontWeight: '600', color: c.text },
  lineaPrecio: { fontSize: 13, color: c.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCant: { fontFamily: c.monoSemi, fontSize: 16, color: c.text, minWidth: 20, textAlign: 'center' },
  footer: {
    borderTopWidth: 1,
    borderTopColor: c.border,
    backgroundColor: c.surface,
    padding: 20,
    gap: 12,
  },
  totalFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, color: c.muted, fontWeight: '600' },
  totalValor: { fontFamily: c.monoSemi, fontSize: 24, color: c.text },
  emitirBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emitirBtnOff: { backgroundColor: c.faint },
  emitirText: { color: c.onBrand, fontSize: 16, fontWeight: '700' },
  cobrarFondo: { flex: 1, backgroundColor: 'rgba(33,29,23,0.45)', justifyContent: 'flex-end' },
  cobrarHoja: {
    backgroundColor: c.bg,
    borderTopLeftRadius: radios.xl,
    borderTopRightRadius: radios.xl,
    maxHeight: '88%',
  },
  cobrarBarra: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  cobrarContent: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },
  cobrarTitulo: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.4 },
  resumenFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resumenLabel: { fontSize: 15, color: c.muted, fontWeight: '600' },
  resumenValor: { fontFamily: c.monoSemi, fontSize: 16, color: c.text },
  descFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  descInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: radios.md,
    paddingHorizontal: 12,
    height: 48,
    minWidth: 130,
  },
  descSimbolo: { fontFamily: c.mono, fontSize: 15, color: c.muted },
  descInput: { flex: 1, fontFamily: c.monoSemi, fontSize: 17, color: c.text, textAlign: 'right' },
  totalPagarCard: {
    backgroundColor: c.brand,
    borderRadius: radios.lg,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalPagarLabel: { fontSize: 14, color: '#B8AF9C', fontWeight: '700', textTransform: 'uppercase' },
  totalPagarValor: { fontFamily: c.monoSemi, fontSize: 26, color: c.onBrand, letterSpacing: -0.5 },
  cobrarSeccion: {
    fontSize: 13,
    fontWeight: '700',
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
  },
  medios: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  medio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  medioOn: { backgroundColor: c.brand, borderColor: c.brand },
  medioText: { fontSize: 13.5, fontWeight: '600', color: c.text },
  medioTextOn: { color: c.onBrand },
  vueltoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3EFE6',
    borderRadius: radios.md,
    padding: 16,
  },
  vueltoFalta: { backgroundColor: '#F3DDDD' },
  vueltoLabel: { fontSize: 15, fontWeight: '700', color: c.ok, textTransform: 'uppercase' },
  vueltoValor: { fontFamily: c.monoSemi, fontSize: 24, color: c.ok },
  vueltoValorFalta: { color: c.danger },
  rapidos: { flexDirection: 'row', gap: 8 },
  rapido: {
    flex: 1,
    backgroundColor: c.surfaceAlt,
    borderRadius: radios.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  rapidoText: { fontSize: 13, fontWeight: '700', color: c.text },
  cobrarAcciones: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingTop: 12 },
  cobrarCancelar: {
    flex: 1,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cobrarCancelarText: { color: c.text, fontSize: 15, fontWeight: '700' },
  cobrarEmitir: {
    flex: 1.6,
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cobrarEmitirText: { color: c.onBrand, fontSize: 15, fontWeight: '700' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  input: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: c.text,
  },
  buscadorModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: radios.md,
    marginHorizontal: 20,
    paddingHorizontal: 13,
    height: 46,
  },
  inputBuscador: { flex: 1, fontSize: 15, color: c.text },
  varios: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: c.surfaceAlt,
    borderRadius: radios.md,
    padding: 14,
  },
  variosInfo: { flex: 1 },
  variosTitulo: { fontSize: 15, fontWeight: '700', color: c.text },
  variosSub: { fontSize: 12.5, color: c.muted, marginTop: 1 },
  consultaCard: { marginHorizontal: 20, marginTop: 12, gap: 10 },
  consultaBtn: {
    backgroundColor: c.brand,
    borderRadius: radios.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  consultaBtnOff: { opacity: 0.5 },
  consultaText: { color: c.onBrand, fontSize: 15, fontWeight: '700' },
  manualBox: { gap: 10 },
  manualLabel: { fontSize: 13, color: c.muted },
  inputManual: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: '#E0D8C8',
    borderRadius: radios.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.text,
  },
  modalCarga: { marginTop: 24 },
  modalLista: { padding: 20, gap: 8 },
  opcion: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radios.md,
    padding: 14,
  },
  opcionTitulo: { fontSize: 15, fontWeight: '600', color: c.text },
  opcionSub: { fontSize: 13, color: c.muted, marginTop: 2 },
});
