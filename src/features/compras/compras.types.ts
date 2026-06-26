import { TonoEstado } from '@/features/ventas/ventas.types';

export interface Compra {
  id: number;
  numero: string;
  tipo: string;
  proveedor: string;
  proveedorNumero: string;
  fecha: string;
  total: number;
  moneda: string;
  estado: string;
  estadoPago: string;
  pagado: boolean;
}

export function tonoPago(pagado: boolean): TonoEstado {
  return pagado ? 'ok' : 'warn';
}
