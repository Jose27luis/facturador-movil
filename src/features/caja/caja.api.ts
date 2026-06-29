import { api } from '@/core/api/client';
import { MedioPagoResumen, ResumenDia } from './caja.types';

type Fila = Record<string, unknown>;

function numero(fila: Fila, clave: string): number {
  const valor = fila[clave];
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim() !== '' && !Number.isNaN(Number(valor))) {
    return Number(valor);
  }
  return 0;
}

function texto(fila: Fila, clave: string): string {
  const valor = fila[clave];
  return typeof valor === 'string' ? valor : valor == null ? '' : String(valor);
}

interface ResumenResponse {
  success?: boolean;
  message?: string;
  data?: {
    date?: string;
    total?: number;
    totals?: { documentos?: number; notas_venta?: number };
    counts?: { facturas?: number; boletas?: number; notas_venta?: number; total?: number };
    payment_methods?: unknown[];
  };
}

export async function obtenerResumenDia(fecha: string): Promise<ResumenDia> {
  const { data } = await api.get<ResumenResponse>(`/mobile/resumen-dia/${fecha}`);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo cargar el resumen del día.');
  }
  const d = data.data;
  const medios: MedioPagoResumen[] = (Array.isArray(d.payment_methods) ? d.payment_methods : [])
    .filter((f): f is Fila => typeof f === 'object' && f !== null)
    .map((f) => ({
      id: texto(f, 'id'),
      descripcion: texto(f, 'descripcion'),
      total: numero(f, 'total'),
      count: numero(f, 'count'),
    }));
  return {
    fecha: d.date ?? fecha,
    total: d.total ?? 0,
    totalDocumentos: d.totals?.documentos ?? 0,
    totalNotasVenta: d.totals?.notas_venta ?? 0,
    facturas: d.counts?.facturas ?? 0,
    boletas: d.counts?.boletas ?? 0,
    notasVenta: d.counts?.notas_venta ?? 0,
    comprobantes: d.counts?.total ?? 0,
    mediosPago: medios,
  };
}
