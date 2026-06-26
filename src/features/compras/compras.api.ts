import { api } from '@/core/api/client';
import { Compra } from './compras.types';

type Fila = Record<string, unknown>;

function texto(fila: Fila, clave: string): string {
  const valor = fila[clave];
  if (typeof valor === 'string') {
    return valor;
  }
  return valor == null ? '' : String(valor);
}

function monto(fila: Fila, clave: string): number {
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

interface RecordsResponse {
  data?: unknown[];
}

export async function listarCompras(input: string): Promise<Compra[]> {
  const { data } = await api.get<RecordsResponse>('/purchases/records', {
    params: { input },
  });
  const filas = Array.isArray(data.data) ? data.data : [];
  return filas.filter(esFila).map((f) => {
    const estadoPago = texto(f, 'state_type_payment_description');
    return {
      id: monto(f, 'id'),
      numero: texto(f, 'number'),
      tipo: texto(f, 'document_type_description'),
      proveedor: texto(f, 'supplier_name'),
      proveedorNumero: texto(f, 'supplier_number'),
      fecha: texto(f, 'date_of_issue'),
      total: monto(f, 'total'),
      moneda: texto(f, 'currency_type_id') || 'PEN',
      estado: texto(f, 'state_type_description'),
      estadoPago,
      pagado: estadoPago.toLowerCase().startsWith('pagado'),
    };
  });
}
