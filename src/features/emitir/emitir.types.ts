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
}

export interface LineaCarrito {
  item: ItemBusqueda;
  cantidad: number;
}

export interface EmitirPayload {
  series_id: number;
  customer_id?: number;
  currency_type_id: string;
  items: { item_id: number; quantity: number }[];
}

export interface EmitirResultado {
  id: number;
  numero: string;
  estadoId: string;
}

export function etiquetaTipo(tipoId: string): string {
  if (tipoId === '01') {
    return 'Factura';
  }
  if (tipoId === '03') {
    return 'Boleta';
  }
  return tipoId;
}
