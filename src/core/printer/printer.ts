import { PermissionsAndroid, Platform } from 'react-native';

import { fmtMonto } from '@/shared/format';
import { Impresora } from './printer-store';

const ANCHO = 48;

const REEMPLAZOS: Record<string, string> = {
  Á: 'A', É: 'E', Í: 'I', Ó: 'O', Ú: 'U', Ü: 'U', Ñ: 'N',
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u', ñ: 'n',
  '¿': '?', '¡': '!', '°': 'o', '–': '-', '—': '-', '’': "'", '“': '"', '”': '"',
};

function ascii(texto: string): string {
  return texto.replace(/[^\x00-\x7F]/g, (ch) => REEMPLAZOS[ch] ?? '');
}

interface LibImpresion {
  BluetoothManager: {
    checkBluetoothEnabled(): Promise<boolean>;
    enableBluetooth(): Promise<string[] | null>;
    connect(direccion: string): Promise<void>;
  };
  BluetoothEscposPrinter: {
    printerInit(): Promise<void>;
    printerAlign(align: number): Promise<void>;
    printText(texto: string, opciones: object): Promise<void>;
    printColumn(anchos: number[], alineaciones: number[], textos: string[], opciones: object): Promise<void>;
    printAndFeed(lineas: number): Promise<void>;
    setBlob(peso: number): Promise<void>;
    printQRCode(contenido: string, tamano: number, correccion: number): Promise<void>;
    ALIGN: { LEFT: number; CENTER: number; RIGHT: number };
  };
}

function lib(): LibImpresion | null {
  try {
    return require('@brooons/react-native-bluetooth-escpos-printer') as LibImpresion;
  } catch {
    return null;
  }
}

function requerirLib(): LibImpresion {
  const m = lib();
  if (!m) {
    throw new Error('La impresión Bluetooth solo funciona en la app instalada (no en Expo Go).');
  }
  return m;
}

export function impresionDisponible(): boolean {
  return lib() !== null;
}

export async function pedirPermisos(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }
  const posibles = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ].filter(Boolean);
  if (posibles.length === 0) {
    return true;
  }
  const res = await PermissionsAndroid.requestMultiple(posibles);
  return Object.values(res).every((v) => v !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN || true);
}

export async function activarBluetooth(): Promise<void> {
  await requerirLib().BluetoothManager.enableBluetooth();
}

export async function listarEmparejadas(): Promise<Impresora[]> {
  const lista = await requerirLib().BluetoothManager.enableBluetooth();
  const arr = Array.isArray(lista) ? lista : [];
  const impresoras: Impresora[] = [];
  for (const fila of arr) {
    try {
      const obj = JSON.parse(fila) as { name?: string; address?: string };
      if (obj.address) {
        impresoras.push({ nombre: obj.name || obj.address, direccion: obj.address });
      }
    } catch {
      // entrada no parseable, se omite
    }
  }
  return impresoras;
}

function linea(): string {
  return '-'.repeat(ANCHO);
}

export interface ItemTicket {
  nombre: string;
  cantidad: number;
  precio: number;
  total: number;
  unidad?: string;
  codigo?: string;
}

export interface DatosTicket {
  empresa: string;
  ruc?: string;
  tipo: string;
  numero: string;
  fecha: string;
  cliente: string;
  clienteDoc?: string;
  items: ItemTicket[];
  gravado?: number;
  exonerado?: number;
  igv?: number;
  total: number;
  moneda: string;
  estado?: string;
  medioPago?: string;
  hora?: string;
  clienteDireccion?: string;
  leyendas?: string[];
  qr?: string;
  hash?: string;
  vendedor?: string;
  condicionPago?: string;
  pagos?: { descripcion: string; monto: number }[];
  empresaDireccion?: string;
  urlConsulta?: string;
}

export async function imprimirTicket(direccion: string, datos: DatosTicket): Promise<void> {
  const { BluetoothManager, BluetoothEscposPrinter } = requerirLib();
  const A = BluetoothEscposPrinter.ALIGN;

  await BluetoothManager.connect(direccion);
  await BluetoothEscposPrinter.printerInit();
  await BluetoothEscposPrinter.setBlob(1);

  const texto = async (valor: string, opciones: object = {}) => {
    await BluetoothEscposPrinter.printText(ascii(valor), opciones);
  };

  const par = async (etiqueta: string, valor: string, grande = false) => {
    await BluetoothEscposPrinter.printColumn(
      [30, 18],
      [A.LEFT, A.RIGHT],
      [ascii(etiqueta), ascii(valor)],
      grande ? { widthtimes: 1, heigthtimes: 1 } : {},
    );
  };

  const dato = async (etiqueta: string, valor: string) => {
    await BluetoothEscposPrinter.printColumn(
      [16, 32],
      [A.LEFT, A.LEFT],
      [ascii(etiqueta), ascii(valor)],
      {},
    );
  };

  await BluetoothEscposPrinter.printerAlign(A.CENTER);
  await texto(`${datos.empresa}\n`, { widthtimes: 1, heigthtimes: 1 });
  if (datos.ruc) {
    await texto(`R.U.C. ${datos.ruc}\n`);
  }
  if (datos.empresaDireccion) {
    await texto(`${datos.empresaDireccion}\n`);
  }
  await texto(`\n${datos.tipo.toUpperCase()}\n`);
  await texto(`${datos.numero}\n\n`, { widthtimes: 1, heigthtimes: 1 });

  await BluetoothEscposPrinter.printerAlign(A.LEFT);
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  await dato('F. EMISION:', datos.fecha);
  if (datos.hora) {
    await dato('H. EMISION:', datos.hora);
  }
  await dato('CLIENTE:', datos.cliente);
  if (datos.clienteDoc) {
    await dato('DOCUMENTO:', datos.clienteDoc);
  }
  if (datos.clienteDireccion) {
    await dato('DIRECCION:', datos.clienteDireccion);
  }
  if (datos.medioPago) {
    await dato('M. PAGO:', datos.medioPago);
  }
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});

  await BluetoothEscposPrinter.printColumn(
    [6, 5, 4, 17, 8, 8],
    [A.LEFT, A.LEFT, A.LEFT, A.LEFT, A.RIGHT, A.RIGHT],
    ['COD.', 'CANT', 'UND', 'DESCRIPCION', 'P.UNIT', 'TOTAL'],
    {},
  );
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});

  for (const it of datos.items) {
    await BluetoothEscposPrinter.printColumn(
      [6, 5, 4, 17, 8, 8],
      [A.LEFT, A.LEFT, A.LEFT, A.LEFT, A.RIGHT, A.RIGHT],
      [
        ascii(it.codigo ?? '').slice(0, 5),
        String(it.cantidad),
        ascii(it.unidad ?? '').slice(0, 3),
        ascii(it.nombre),
        fmtMonto(it.precio, datos.moneda),
        fmtMonto(it.total, datos.moneda),
      ],
      {},
    );
  }

  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  if (datos.gravado) {
    await par('OP. GRAVADAS:', fmtMonto(datos.gravado, datos.moneda));
  }
  if (datos.exonerado) {
    await par('OP. EXONERADAS:', fmtMonto(datos.exonerado, datos.moneda));
  }
  if (datos.igv) {
    await par('IGV:', fmtMonto(datos.igv, datos.moneda));
  }
  await par('TOTAL A PAGAR:', fmtMonto(datos.total, datos.moneda), true);
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});

  await BluetoothEscposPrinter.printerAlign(A.LEFT);
  const leyendas = datos.leyendas ?? [];
  if (leyendas.length > 0) {
    await texto('LEYENDAS:\n');
    for (const leyenda of leyendas) {
      await texto(`${leyenda.trim().toUpperCase()}\n`);
    }
    await texto(`${linea()}\n`);
  }

  if (datos.condicionPago) {
    await texto(`CONDICION DE PAGO: ${datos.condicionPago}\n`);
  }
  if ((datos.pagos ?? []).length > 0) {
    await texto('PAGOS:\n');
    for (const pago of datos.pagos ?? []) {
      await par(`  ${pago.descripcion}`, fmtMonto(pago.monto, datos.moneda));
    }
  }
  if (datos.vendedor) {
    await texto(`VENDEDOR: ${datos.vendedor}\n`);
  }

  await BluetoothEscposPrinter.printerAlign(A.CENTER);
  if (datos.qr) {
    await BluetoothEscposPrinter.printText('\n', {});
    await BluetoothEscposPrinter.printQRCode(datos.qr, 220, 2);
    await BluetoothEscposPrinter.printText('\n', {});
  }
  if (datos.hash) {
    await texto(`CODIGO HASH: ${datos.hash}\n`);
  }
  if (datos.estado) {
    await texto(`${datos.estado.toUpperCase()}\n`);
  }
  if (datos.urlConsulta) {
    await texto('\nConsulta tu comprobante en:\n');
    await texto(`${datos.urlConsulta}\n`);
  }
  await texto(`\nREPRESENTACION IMPRESA DE LA\n${datos.tipo.toUpperCase()}\n`);
  await texto('\nGRACIAS POR SU COMPRA\n');
  await BluetoothEscposPrinter.printAndFeed(3);
}

export async function imprimirPrueba(direccion: string): Promise<void> {
  const { BluetoothManager, BluetoothEscposPrinter } = requerirLib();
  await BluetoothManager.connect(direccion);
  await BluetoothEscposPrinter.printerInit();
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await BluetoothEscposPrinter.printText('Amantix\n', { widthtimes: 1, heigthtimes: 1 });
  await BluetoothEscposPrinter.printText('Prueba de impresion\n', {});
  await BluetoothEscposPrinter.printText('Impresora conectada correctamente\n', {});
  await BluetoothEscposPrinter.printAndFeed(3);
}
