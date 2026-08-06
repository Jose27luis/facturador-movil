import { PermissionsAndroid, Platform } from 'react-native';

import { fmtMonto } from '@/shared/format';
import { Impresora } from './printer-store';

const ANCHO = 32;

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
}

export async function imprimirTicket(direccion: string, datos: DatosTicket): Promise<void> {
  const { BluetoothManager, BluetoothEscposPrinter } = requerirLib();
  const A = BluetoothEscposPrinter.ALIGN;

  await BluetoothManager.connect(direccion);
  await BluetoothEscposPrinter.printerInit();
  await BluetoothEscposPrinter.setBlob(1);

  const par = async (etiqueta: string, valor: string, grande = false) => {
    await BluetoothEscposPrinter.printColumn(
      [14, 18],
      [A.LEFT, A.RIGHT],
      [etiqueta, valor],
      grande ? { widthtimes: 1, heigthtimes: 1 } : {},
    );
  };

  await BluetoothEscposPrinter.printerAlign(A.CENTER);
  await BluetoothEscposPrinter.printText(`${datos.empresa}\n`, { widthtimes: 1, heigthtimes: 1 });
  if (datos.ruc) {
    await BluetoothEscposPrinter.printText(`RUC ${datos.ruc}\n`, {});
  }
  await BluetoothEscposPrinter.printText(`${datos.tipo.toUpperCase()}\n`, {});
  await BluetoothEscposPrinter.printText(`${datos.numero}\n`, { widthtimes: 1, heigthtimes: 1 });

  await BluetoothEscposPrinter.printerAlign(A.LEFT);
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  await BluetoothEscposPrinter.printText(`FECHA : ${datos.fecha}\n`, {});
  await BluetoothEscposPrinter.printText(`CLIENTE: ${datos.cliente}\n`, {});
  if (datos.clienteDoc) {
    await BluetoothEscposPrinter.printText(`DOC.  : ${datos.clienteDoc}\n`, {});
  }
  if (datos.medioPago) {
    await BluetoothEscposPrinter.printText(`PAGO  : ${datos.medioPago}\n`, {});
  }
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  await BluetoothEscposPrinter.printText('CANT  DESCRIPCION         IMPORTE\n', {});
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});

  for (const it of datos.items) {
    await BluetoothEscposPrinter.printText(`${it.nombre}\n`, {});
    await BluetoothEscposPrinter.printColumn(
      [18, 14],
      [A.LEFT, A.RIGHT],
      [`  ${it.cantidad} x ${fmtMonto(it.precio, datos.moneda)}`, fmtMonto(it.total, datos.moneda)],
      {},
    );
  }

  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  if (datos.gravado) {
    await par('OP. GRAVADA', fmtMonto(datos.gravado, datos.moneda));
  }
  if (datos.exonerado) {
    await par('OP. EXONERADA', fmtMonto(datos.exonerado, datos.moneda));
  }
  if (datos.igv) {
    await par('IGV 18%', fmtMonto(datos.igv, datos.moneda));
  }
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  await par('TOTAL', fmtMonto(datos.total, datos.moneda), true);
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});

  await BluetoothEscposPrinter.printerAlign(A.CENTER);
  if (datos.estado) {
    await BluetoothEscposPrinter.printText(`${datos.estado.toUpperCase()}\n`, {});
  }
  await BluetoothEscposPrinter.printText('REPRESENTACION IMPRESA DEL\n', {});
  await BluetoothEscposPrinter.printText('COMPROBANTE ELECTRONICO\n', {});
  await BluetoothEscposPrinter.printText('\nGRACIAS POR SU COMPRA\n', {});
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
