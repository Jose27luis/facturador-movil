import { api } from '@/core/api/client';
import { Producto } from './productos.types';

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

interface ItemsResponse {
  data?: { items?: unknown[] };
}

export async function listarProductos(input: string): Promise<Producto[]> {
  const { data } = await api.get<ItemsResponse>('/document/search-items', {
    params: { input, limit: 50 },
  });
  const filas = data.data?.items ?? [];
  return filas.filter(esFila).map((f) => ({
    id: numero(f, 'item_id') || numero(f, 'id'),
    nombre: texto(f, 'name') || texto(f, 'description'),
    codigo: texto(f, 'internal_id') || texto(f, 'item_code'),
    precio: numero(f, 'sale_unit_price'),
    moneda: texto(f, 'currency_type_id') || 'PEN',
    stock: numero(f, 'stock'),
    categoria: texto(f, 'category'),
    imagen: texto(f, 'image'),
  }));
}

export interface NuevoProducto {
  description: string;
  sale_unit_price: number;
  stock: number;
  sale_affectation_igv_type_id: string;
}

export interface EditarProducto {
  description: string;
  sale_unit_price: number;
}

interface GuardarResponse {
  success?: boolean;
  msg?: string;
  message?: string;
}

export async function crearProducto(payload: NuevoProducto): Promise<void> {
  const { data } = await api.post<GuardarResponse>('/mobile/items', payload);
  if (!data.success) {
    throw new Error(data.msg || data.message || 'No se pudo registrar el producto.');
  }
}

export async function actualizarProducto(id: number, payload: EditarProducto): Promise<void> {
  const { data } = await api.post<GuardarResponse>(`/mobile/items/${id}`, payload);
  if (!data.success) {
    throw new Error(data.msg || data.message || 'No se pudo actualizar el producto.');
  }
}
