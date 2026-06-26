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

function mapSeries(filas: unknown): Serie[] {
  const arr = Array.isArray(filas) ? filas : [];
  return arr.filter(esFila).map((f) => ({
    id: numero(f, 'id'),
    tipoId: texto(f, 'document_type_id'),
    numero: texto(f, 'number'),
    esDefault: Boolean(f.is_default),
  }));
}

export async function obtenerSeries(): Promise<Serie[]> {
  const [docs, nvs] = await Promise.all([
    api.get<unknown>('/document/series'),
    api.get<unknown>('/sale-note/series').catch(() => ({ data: [] })),
  ]);
  const documentos = mapSeries(docs.data).filter((s) => s.tipoId === '01' || s.tipoId === '03');
  const notas = mapSeries(nvs.data).filter((s) => s.tipoId === '80');
  return [...documentos, ...notas];
}

export type ResultadoLookup =
  | { ok: true; cliente: ClienteBusqueda }
  | { ok: false; needsName: boolean; message: string };

interface LookupResponse {
  success?: boolean;
  needs_name?: boolean;
  message?: string;
  data?: { id?: number; name?: string; number?: string; descripcion?: string };
}

export async function consultarCliente(numero: string, nombre?: string): Promise<ResultadoLookup> {
  const { data } = await api.post<LookupResponse>('/mobile/customers/lookup', {
    number: numero,
    name: nombre,
  });
  if (data.success && data.data) {
    return {
      ok: true,
      cliente: {
        id: numero2(data.data.id),
        nombre: data.data.name ?? '',
        numero: data.data.number ?? '',
        descripcion: data.data.descripcion ?? `${data.data.number ?? ''} - ${data.data.name ?? ''}`,
      },
    };
  }
  return {
    ok: false,
    needsName: Boolean(data.needs_name),
    message: data.message ?? 'No se pudo consultar el documento.',
  };
}

function numero2(v: number | undefined): number {
  return typeof v === 'number' ? v : 0;
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
  data?: { id?: number; number?: string; state_type_id?: string; pdf_url?: string };
}

export async function emitirDocumento(
  payload: EmitirPayload,
  esNotaVenta: boolean,
): Promise<EmitirResultado> {
  const ruta = esNotaVenta ? '/mobile/sale-notes' : '/mobile/documents';
  const { data } = await api.post<EmitirResponse>(ruta, payload);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo emitir el comprobante.');
  }
  return {
    id: data.data.id ?? 0,
    numero: data.data.number ?? '',
    estadoId: data.data.state_type_id ?? '',
    pdfUrl: data.data.pdf_url ?? '',
  };
}
