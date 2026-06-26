import { api } from '@/core/api/client';
import {
  ClienteBusqueda,
  EmitirPayload,
  EmitirResultado,
  ItemBusqueda,
  Serie,
} from './emitir.types';

type Fila = Record<string, unknown>;

function texto(fila: Fila, clave: string): string {
  const valor = fila[clave];
  if (typeof valor === 'string') {
    return valor;
  }
  return valor == null ? '' : String(valor);
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

export async function obtenerSeries(): Promise<Serie[]> {
  const { data } = await api.get<unknown>('/document/series');
  const filas = Array.isArray(data) ? data : [];
  return filas
    .filter(esFila)
    .map((f) => ({
      id: numero(f, 'id'),
      tipoId: texto(f, 'document_type_id'),
      numero: texto(f, 'number'),
      esDefault: Boolean(f.is_default),
    }))
    .filter((s) => s.tipoId === '01' || s.tipoId === '03');
}

interface ClientesResponse {
  data?: { customers?: unknown[] };
}

export async function buscarClientes(input: string, tipoId: string): Promise<ClienteBusqueda[]> {
  const { data } = await api.get<ClientesResponse>('/document/search-customers', {
    params: { input, document_type_id: tipoId },
  });
  const filas = data.data?.customers ?? [];
  return filas.filter(esFila).map((f) => ({
    id: numero(f, 'id'),
    nombre: texto(f, 'name'),
    numero: texto(f, 'number'),
    descripcion: texto(f, 'description'),
  }));
}

interface ItemsResponse {
  data?: { items?: unknown[] };
}

export async function buscarItems(input: string): Promise<ItemBusqueda[]> {
  const { data } = await api.get<ItemsResponse>('/document/search-items', {
    params: { input, limit: 25 },
  });
  const filas = data.data?.items ?? [];
  return filas.filter(esFila).map((f) => ({
    id: numero(f, 'item_id') || numero(f, 'id'),
    nombre: texto(f, 'name') || texto(f, 'description'),
    descripcion: texto(f, 'full_description') || texto(f, 'description'),
    precio: numero(f, 'sale_unit_price'),
    moneda: texto(f, 'currency_type_id') || 'PEN',
    stock: numero(f, 'stock'),
    afectacionId: texto(f, 'sale_affectation_igv_type_id'),
  }));
}

interface EmitirResponse {
  success?: boolean;
  message?: string;
  data?: { id?: number; number?: string; state_type_id?: string };
}

export async function emitirDocumento(payload: EmitirPayload): Promise<EmitirResultado> {
  const { data } = await api.post<EmitirResponse>('/mobile/documents', payload);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo emitir el comprobante.');
  }
  return {
    id: data.data.id ?? 0,
    numero: data.data.number ?? '',
    estadoId: data.data.state_type_id ?? '',
  };
}
