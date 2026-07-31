export interface Serie {
  id: number;
  tipoId: string;
  numero: string;
  esDefault: boolean;
}

export interface ClienteBusqueda {
  id: number;
  nombre: string;
  numero: string;
  descripcion: string;
}

export interface ItemBusqueda {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  moneda: string;
  stock: number;
  afectacionId: string;
  libre?: boolean;
}

export interface LineaCarrito {
  item: ItemBusqueda;
  cantidad: number;
}

export interface EmitirItemPayload {
  item_id?: number;
  quantity: number;
  unit_price?: number;
  libre?: boolean;
  description?: string;
  affectation_igv_type_id?: string;
}

export interface EmitirPayload {
  series_id: number;
  customer_id?: number;
  currency_type_id: string;
  items: EmitirItemPayload[];
  payment?: { payment_method_type_id: string };
}

export interface EmitirResultado {
  id: number;
  numero: string;
  estadoId: string;
  pdfUrl: string;
  pdfTicket: string;
}

export interface ConfiguracionEmision {
  afectacionPorDefecto: string;
}

export const AFECTACIONES: { id: string; etiqueta: string }[] = [
  { id: '10', etiqueta: 'Gravado · 18%' },
  { id: '20', etiqueta: 'Exonerado' },
  { id: '30', etiqueta: 'Inafecto' },
];

export function esAfectacionValida(id: string): boolean {
  return AFECTACIONES.some((a) => a.id === id);
}

export function etiquetaTipo(tipoId: string): string {
  if (tipoId === '01') {
    return 'Factura';
  }
  if (tipoId === '03') {
    return 'Boleta';
  }
  if (tipoId === '80') {
    return 'Nota de venta';
  }
  return tipoId;
}
