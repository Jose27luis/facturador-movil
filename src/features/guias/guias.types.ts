export interface OpcionCatalogo {
  id: string;
  descripcion: string;
}

export interface SerieGuia {
  id: number;
  numero: string;
}

export interface Conductor {
  id: number;
  nombre: string;
  numero: string;
  licencia: string;
}

export interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
}

export interface CatalogosGuia {
  series: SerieGuia[];
  motivos: OpcionCatalogo[];
  modalidades: OpcionCatalogo[];
  conductores: Conductor[];
  vehiculos: Vehiculo[];
  origenDireccion: string;
  origenUbigeo: string;
}

export interface ItemGuia {
  itemId: number;
  descripcion: string;
  cantidad: number;
  unidad: string;
}

export interface DatosGuia {
  documentId: number;
  numero: string;
  tipo: string;
  clienteNombre: string;
  clienteNumero: string;
  clienteDireccion: string;
  clienteUbigeo: string;
  items: ItemGuia[];
}

export interface GuiaPayload {
  documentId: number;
  motivoId: string;
  modalidadId: string;
  fechaTraslado: string;
  origenDireccion: string;
  origenUbigeo: string;
  destinoDireccion: string;
  destinoUbigeo: string;
  pesoTotal: number;
  bultos: number;
  observaciones?: string;
  conductorId?: number;
  vehiculoId?: number;
  transportistaNumero?: string;
  transportistaNombre?: string;
}

export interface GuiaResultado {
  id: number;
  numero: string;
  estadoId: string;
  estado: string;
  enviado: boolean;
  mensaje: string;
  pdfUrl: string;
}

export interface Guia {
  id: number;
  numero: string;
  fecha: string;
  cliente: string;
  estadoId: string;
  estado: string;
  pdfUrl: string;
}

export const MODALIDAD_PUBLICO = '01';
export const MODALIDAD_PRIVADO = '02';
