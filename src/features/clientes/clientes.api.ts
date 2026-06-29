import { api } from '@/core/api/client';
import { ClienteListado, CompraHistorial, HistorialCliente } from './clientes.types';

type Fila = Record<string, unknown>;

function texto(fila: Fila, clave: string): string {
  const valor = fila[clave];
  return typeof valor === 'string' ? valor : valor == null ? '' : String(valor);
}

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

function esFila(v: unknown): v is Fila {
  return typeof v === 'object' && v !== null;
}

interface ClientesResponse {
  data?: { customers?: unknown[] };
}

export async function buscarClientes(input: string): Promise<ClienteListado[]> {
  const { data } = await api.get<ClientesResponse>('/document/search-customers', {
    params: { input, document_type_id: '03' },
  });
  const filas = data.data?.customers ?? [];
  return filas.filter(esFila).map((f) => ({
    id: numero(f, 'id'),
    nombre: texto(f, 'name'),
    numero: texto(f, 'number'),
    descripcion: texto(f, 'description'),
  }));
}

interface HistorialResponse {
  success?: boolean;
  message?: string;
  data?: {
    cliente?: Fila;
    resumen?: Fila;
    historial?: unknown[];
  };
}

export async function obtenerHistorial(id: number): Promise<HistorialCliente> {
  const { data } = await api.get<HistorialResponse>(`/mobile/clientes/${id}/historial`);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo cargar el historial del cliente.');
  }
  const cl = data.data.cliente ?? {};
  const re = data.data.resumen ?? {};
  const historial: CompraHistorial[] = (Array.isArray(data.data.historial) ? data.data.historial : [])
    .filter(esFila)
    .map((f) => ({
      id: numero(f, 'id'),
      numero: texto(f, 'number'),
      tipoId: texto(f, 'document_type_id'),
      tipo: texto(f, 'document_type_description'),
      fecha: texto(f, 'date_of_issue'),
      total: numero(f, 'total'),
      moneda: texto(f, 'currency_type_id') || 'PEN',
      estadoId: texto(f, 'state_type_id'),
      estado: texto(f, 'state_type_description'),
      esNotaVenta: Boolean(f.es_nota_venta),
    }));
  return {
    cliente: {
      id: numero(cl, 'id'),
      nombre: texto(cl, 'name'),
      numero: texto(cl, 'number'),
      tipoDocumento: texto(cl, 'identity_document_type_description'),
      direccion: texto(cl, 'address'),
      telefono: texto(cl, 'telephone'),
      email: texto(cl, 'email'),
    },
    totalComprado: numero(re, 'total_comprado'),
    comprobantes: numero(re, 'comprobantes'),
    ultimaCompra: typeof re.ultima_compra === 'string' ? re.ultima_compra : null,
    historial,
  };
}
