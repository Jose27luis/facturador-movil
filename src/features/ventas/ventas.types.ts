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
