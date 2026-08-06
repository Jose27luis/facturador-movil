export interface Comprobante {
  id: number;
  numero: string;
  cliente: string;
  clienteDoc: string;
  total: number;
  moneda: string;
  fecha: string;
  estadoId: string;
  estado: string;
  tipoId: string;
  tipo: string;
  esNotaVenta: boolean;
  pagoEtiqueta: string;
}

export interface LineaComprobante {
  id: number;
  itemId: number;
  descripcion: string;
  unidad: string;
  codigo: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface ComprobanteDetalle {
  id: number;
  numero: string;
  tipoId: string;
  tipo: string;
  estadoId: string;
  estado: string;
  cliente: string;
  clienteDoc: string;
  fecha: string;
  moneda: string;
  totalGravado: number;
  totalExonerado: number;
  totalIgv: number;
  total: number;
  pdfUrl: string;
  pdfTicket: string;
  hora: string;
  clienteDireccion: string;
  leyendas: string[];
  qr: string;
  hash: string;
  vendedor: string;
  condicionPago: string;
  pagos: { descripcion: string; monto: number }[];
  empresaNombre: string;
  empresaRuc: string;
  empresaDireccion: string;
  urlConsulta: string;
  logoBase64: string;
  items: LineaComprobante[];
}

export interface ReenvioResultado {
  estadoId: string;
  estado: string;
  mensaje: string;
}

export type TonoEstado = 'ok' | 'warn' | 'danger' | 'muted';

export function tonoEstado(estadoId: string): TonoEstado {
  if (estadoId === '05') {
    return 'ok';
  }
  if (estadoId === '01' || estadoId === '03') {
    return 'warn';
  }
  if (estadoId === '09' || estadoId === '11' || estadoId === '13') {
    return 'danger';
  }
  return 'muted';
}
