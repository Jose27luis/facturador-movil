import { api } from '@/core/api/client';
import { CierreCaja, EstadoCaja, MedioPagoResumen, ResumenDia } from './caja.types';

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

function mapMedios(lista: unknown): MedioPagoResumen[] {
  return (Array.isArray(lista) ? lista : [])
    .filter((f): f is Fila => typeof f === 'object' && f !== null)
    .map((f) => ({
      id: texto(f, 'id'),
      descripcion: texto(f, 'descripcion'),
      total: numero(f, 'total'),
      count: numero(f, 'count'),
    }));
}

interface CajaResponse {
  success?: boolean;
  message?: string;
  data?: Fila;
}

export async function obtenerEstadoCaja(): Promise<EstadoCaja> {
  const { data } = await api.get<CajaResponse>('/mobile/caja');
  const d = data.data ?? {};
  const rep: Fila = typeof d.reportes === 'object' && d.reportes !== null ? (d.reportes as Fila) : {};
  return {
    abierta: Boolean(d.abierta),
    cashId: numero(d, 'cash_id'),
    fechaApertura: texto(d, 'fecha_apertura'),
    horaApertura: texto(d, 'hora_apertura'),
    usuario: texto(d, 'usuario'),
    saldoInicial: numero(d, 'saldo_inicial'),
    ventas: numero(d, 'ventas'),
    comprobantes: numero(d, 'comprobantes'),
    esperadoEfectivo: numero(d, 'esperado_efectivo'),
    esperadoTotal: numero(d, 'esperado_total'),
    mediosPago: mapMedios(d.medios_pago),
    reportes: {
      a4: texto(rep, 'a4'),
      ticket: texto(rep, 'ticket'),
      productos: texto(rep, 'productos'),
    },
  };
}

export async function abrirCaja(saldoInicial: number): Promise<number> {
  const { data } = await api.post<CajaResponse>('/mobile/caja/abrir', {
    beginning_balance: saldoInicial,
  });
  if (!data.success) {
    throw new Error(data.message || 'No se pudo abrir la caja.');
  }
  return numero(data.data ?? {}, 'cash_id');
}

export async function cerrarCaja(efectivoReal: number | null): Promise<CierreCaja> {
  const { data } = await api.post<CajaResponse>('/mobile/caja/cerrar', {
    ...(efectivoReal !== null ? { efectivo_real: efectivoReal } : {}),
  });
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo cerrar la caja.');
  }
  const d = data.data;
  return {
    saldoInicial: numero(d, 'saldo_inicial'),
    ventas: numero(d, 'ventas'),
    comprobantes: numero(d, 'comprobantes'),
    esperadoEfectivo: numero(d, 'esperado_efectivo'),
    esperadoTotal: numero(d, 'esperado_total'),
    efectivoReal: typeof d.efectivo_real === 'number' ? d.efectivo_real : null,
    diferencia: typeof d.diferencia === 'number' ? d.diferencia : null,
    mediosPago: mapMedios(d.medios_pago),
  };
}
