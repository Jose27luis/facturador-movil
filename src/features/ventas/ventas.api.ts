import { api } from '@/core/api/client';
import { Comprobante } from './ventas.types';

interface ListsResponse {
  data?: unknown[];
}

type Fila = Record<string, unknown>;

function leerTexto(fila: Fila, clave: string): string {
  const valor = fila[clave];
  if (typeof valor === 'string') {
    return valor;
  }
  return valor == null ? '' : String(valor);
}

function leerMonto(fila: Fila, clave: string): number {
  const valor = fila[clave];
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim() !== '' && !Number.isNaN(Number(valor))) {
    return Number(valor);
  }
  return 0;
}

function mapComprobante(fila: Fila): Comprobante {
  return {
    id: leerMonto(fila, 'id'),
    numero: leerTexto(fila, 'number'),
    cliente: leerTexto(fila, 'customer_name'),
    clienteDoc: leerTexto(fila, 'customer_number'),
    total: leerMonto(fila, 'total'),
    moneda: leerTexto(fila, 'currency_type_id') || 'PEN',
    fecha: leerTexto(fila, 'date_of_issue'),
    estadoId: leerTexto(fila, 'state_type_id'),
    estado: leerTexto(fila, 'state_type_description'),
    tipoId: leerTexto(fila, 'document_type_id'),
    tipo: leerTexto(fila, 'document_type_description'),
  };
}

export async function listarComprobantes(): Promise<Comprobante[]> {
  const { data } = await api.get<ListsResponse>('/documents/lists');
  const filas = Array.isArray(data.data) ? data.data : [];
  return filas.filter((f): f is Fila => typeof f === 'object' && f !== null).map(mapComprobante);
}
