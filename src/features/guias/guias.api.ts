import { api } from '@/core/api/client';
import {
  CatalogosGuia,
  Conductor,
  DatosGuia,
  Guia,
  GuiaPayload,
  GuiaResultado,
  ItemGuia,
  OpcionCatalogo,
  SerieGuia,
  Vehiculo,
} from './guias.types';

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

function filas(valor: unknown): Fila[] {
  return Array.isArray(valor)
    ? valor.filter((f): f is Fila => typeof f === 'object' && f !== null)
    : [];
}

interface RespuestaCatalogos {
  success?: boolean;
  message?: string;
  data?: Fila;
}

export async function obtenerCatalogosGuia(): Promise<CatalogosGuia> {
  const { data } = await api.get<RespuestaCatalogos>('/mobile/guias/tables');
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudieron cargar los datos de la guía.');
  }
  const d = data.data;
  const origen = typeof d.origen_sugerido === 'object' && d.origen_sugerido !== null
    ? (d.origen_sugerido as Fila)
    : {};

  return {
    series: filas(d.series).map<SerieGuia>((f) => ({ id: numero(f, 'id'), numero: texto(f, 'number') })),
    motivos: filas(d.motivos).map<OpcionCatalogo>((f) => ({
      id: texto(f, 'id'),
      descripcion: texto(f, 'descripcion'),
    })),
    modalidades: filas(d.modalidades).map<OpcionCatalogo>((f) => ({
      id: texto(f, 'id'),
      descripcion: texto(f, 'descripcion'),
    })),
    conductores: filas(d.conductores).map<Conductor>((f) => ({
      id: numero(f, 'id'),
      nombre: texto(f, 'nombre'),
      numero: texto(f, 'numero'),
      licencia: texto(f, 'licencia'),
    })),
    vehiculos: filas(d.vehiculos).map<Vehiculo>((f) => ({
      id: numero(f, 'id'),
      placa: texto(f, 'placa'),
      marca: texto(f, 'marca'),
      modelo: texto(f, 'modelo'),
    })),
    origenDireccion: texto(origen, 'direccion'),
    origenUbigeo: texto(origen, 'ubigeo'),
  };
}

export async function obtenerDatosGuia(documentId: number): Promise<DatosGuia> {
  const { data } = await api.get<RespuestaCatalogos>(`/mobile/guias/documento/${documentId}`);
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo cargar el comprobante.');
  }
  const d = data.data;
  const cliente = typeof d.cliente === 'object' && d.cliente !== null ? (d.cliente as Fila) : {};

  return {
    documentId: numero(d, 'document_id'),
    numero: texto(d, 'numero'),
    tipo: texto(d, 'tipo'),
    clienteNombre: texto(cliente, 'nombre'),
    clienteNumero: texto(cliente, 'numero'),
    clienteDireccion: texto(cliente, 'direccion'),
    clienteUbigeo: texto(cliente, 'ubigeo'),
    items: filas(d.items).map<ItemGuia>((f) => ({
      itemId: numero(f, 'item_id'),
      descripcion: texto(f, 'descripcion'),
      cantidad: numero(f, 'cantidad'),
      unidad: texto(f, 'unit_type_id'),
    })),
  };
}

export async function listarGuias(): Promise<Guia[]> {
  const { data } = await api.get<RespuestaCatalogos>('/mobile/guias');
  return filas(data.data).map<Guia>((f) => ({
    id: numero(f, 'id'),
    numero: texto(f, 'numero'),
    fecha: texto(f, 'fecha'),
    cliente: texto(f, 'cliente'),
    estadoId: texto(f, 'estado_id'),
    estado: texto(f, 'estado'),
    pdfUrl: texto(f, 'pdf_url'),
  }));
}

export async function crearGuia(payload: GuiaPayload): Promise<GuiaResultado> {
  const { data } = await api.post<RespuestaCatalogos>('/mobile/guias', {
    document_id: payload.documentId,
    transfer_reason_type_id: payload.motivoId,
    transport_mode_type_id: payload.modalidadId,
    date_of_shipping: payload.fechaTraslado,
    origin_address: payload.origenDireccion,
    origin_ubigeo: payload.origenUbigeo,
    delivery_address: payload.destinoDireccion,
    delivery_ubigeo: payload.destinoUbigeo,
    total_weight: payload.pesoTotal,
    packages_number: payload.bultos,
    observations: payload.observaciones,
    driver_id: payload.conductorId,
    transport_id: payload.vehiculoId,
    dispatcher_number: payload.transportistaNumero,
    dispatcher_name: payload.transportistaNombre,
  });

  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo generar la guía.');
  }
  const d = data.data;

  return {
    id: numero(d, 'id'),
    numero: texto(d, 'numero'),
    estadoId: texto(d, 'estado_id'),
    estado: texto(d, 'estado'),
    enviado: Boolean(d.enviado),
    mensaje: texto(d, 'mensaje'),
    pdfUrl: texto(d, 'pdf_url'),
  };
}
