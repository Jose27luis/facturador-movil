import { PermissionsAndroid, Platform } from 'react-native';
import {
  BluetoothEscposPrinter,
  BluetoothManager,
} from '@brooons/react-native-bluetooth-escpos-printer';

import { fmtMonto } from '@/shared/format';
import { Impresora } from './printer-store';

const ANCHO = 32;

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

export async function bluetoothActivo(): Promise<boolean> {
  try {
    return Boolean(await BluetoothManager.checkBluetoothEnabled());
  } catch {
    return false;
  }
}

export async function activarBluetooth(): Promise<void> {
  await BluetoothManager.enableBluetooth();
}

export async function listarEmparejadas(): Promise<Impresora[]> {
  const lista = await BluetoothManager.enableBluetooth();
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
  items: ItemTicket[];
  total: number;
  moneda: string;
}

export async function imprimirTicket(direccion: string, datos: DatosTicket): Promise<void> {
  await BluetoothManager.connect(direccion);
  await BluetoothEscposPrinter.printerInit();

  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await BluetoothEscposPrinter.printText(`${datos.empresa}\n`, { widthtimes: 1, heigthtimes: 1 });
  if (datos.ruc) {
    await BluetoothEscposPrinter.printText(`RUC ${datos.ruc}\n`, {});
  }
  await BluetoothEscposPrinter.printText(`${datos.tipo}\n`, {});
  await BluetoothEscposPrinter.printText(`${datos.numero}\n`, {});

  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.LEFT);
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  await BluetoothEscposPrinter.printText(`Fecha: ${datos.fecha}\n`, {});
  await BluetoothEscposPrinter.printText(`Cliente: ${datos.cliente}\n`, {});
  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});

  for (const it of datos.items) {
    await BluetoothEscposPrinter.printText(`${it.nombre}\n`, {});
    await BluetoothEscposPrinter.printColumn(
      [16, 16],
      [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
      [`${it.cantidad} x ${fmtMonto(it.precio, datos.moneda)}`, fmtMonto(it.total, datos.moneda)],
      {},
    );
  }

  await BluetoothEscposPrinter.printText(`${linea()}\n`, {});
  await BluetoothEscposPrinter.printColumn(
    [16, 16],
    [BluetoothEscposPrinter.ALIGN.LEFT, BluetoothEscposPrinter.ALIGN.RIGHT],
    ['TOTAL', fmtMonto(datos.total, datos.moneda)],
    { widthtimes: 1, heigthtimes: 1 },
  );

  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await BluetoothEscposPrinter.printText('\nGracias por su compra\n', {});
  await BluetoothEscposPrinter.printAndFeed(3);
}

export async function imprimirPrueba(direccion: string): Promise<void> {
  await BluetoothManager.connect(direccion);
  await BluetoothEscposPrinter.printerInit();
  await BluetoothEscposPrinter.printerAlign(BluetoothEscposPrinter.ALIGN.CENTER);
  await BluetoothEscposPrinter.printText('Amantix\n', { widthtimes: 1, heigthtimes: 1 });
  await BluetoothEscposPrinter.printText('Prueba de impresion\n', {});
  await BluetoothEscposPrinter.printText('Impresora conectada correctamente\n', {});
  await BluetoothEscposPrinter.printAndFeed(3);
}
