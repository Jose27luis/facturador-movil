import { api } from '@/core/api/client';
import { Comprobante, ComprobanteDetalle, LineaComprobante, ReenvioResultado } from './ventas.types';

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
    esNotaVenta: Boolean(fila.es_nota_venta),
    pagoEtiqueta: leerTexto(fila, 'payment_label'),
  };
}

export async function listarComprobantes(): Promise<Comprobante[]> {
  const { data } = await api.get<ListsResponse>('/mobile/ventas');
  const filas = Array.isArray(data.data) ? data.data : [];
  return filas.filter((f): f is Fila => typeof f === 'object' && f !== null).map(mapComprobante);
}

interface DetalleResponse {
  data?: Fila;
}

interface ReenvioResponse {
  success?: boolean;
  message?: string;
  data?: {
    state_type_id?: string;
    state_type_description?: string;
    message?: string;
  };
}

export async function reenviarDocumento(id: number): Promise<ReenvioResultado> {
  const { data } = await api.post<ReenvioResponse>('/mobile/reenviar', { document_id: id });
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo reenviar el comprobante.');
  }
  return {
    estadoId: data.data.state_type_id ?? '',
    estado: data.data.state_type_description ?? '',
    mensaje: data.data.message ?? 'Reenviado a SUNAT.',
  };
}

export async function obtenerComprobanteDetalle(
  id: number,
  esNotaVenta: boolean,
): Promise<ComprobanteDetalle> {
  const ruta = esNotaVenta ? `/mobile/sale-notes/${id}` : `/mobile/documents/${id}`;
  const { data } = await api.get<DetalleResponse>(ruta);
  const d = data.data ?? {};
  const empresa = typeof d.company === 'object' && d.company !== null ? (d.company as Fila) : {};
  const filas = Array.isArray(d.items) ? d.items : [];
  const items: LineaComprobante[] = filas
    .filter((f): f is Fila => typeof f === 'object' && f !== null)
    .map((f) => ({
      id: leerMonto(f, 'id'),
      itemId: leerMonto(f, 'item_id'),
      descripcion: leerTexto(f, 'description'),
      unidad: leerTexto(f, 'unit_type_id'),
      codigo: leerTexto(f, 'internal_id'),
      cantidad: leerMonto(f, 'quantity'),
      precioUnitario: leerMonto(f, 'unit_price'),
      total: leerMonto(f, 'total'),
    }));
  return {
    id: leerMonto(d, 'id'),
    numero: leerTexto(d, 'number'),
    tipoId: leerTexto(d, 'document_type_id'),
    tipo: leerTexto(d, 'document_type_description'),
    estadoId: leerTexto(d, 'state_type_id'),
    estado: leerTexto(d, 'state_type_description'),
    cliente: leerTexto(d, 'customer_name'),
    clienteDoc: leerTexto(d, 'customer_number'),
    fecha: leerTexto(d, 'date_of_issue'),
    moneda: leerTexto(d, 'currency_type_id') || 'PEN',
    totalGravado: leerMonto(d, 'total_taxed'),
    totalExonerado: leerMonto(d, 'total_exonerated'),
    totalIgv: leerMonto(d, 'total_igv'),
    total: leerMonto(d, 'total'),
    pdfUrl: leerTexto(d, 'pdf_url'),
    pdfTicket: leerTexto(d, 'pdf_ticket'),
    hora: leerTexto(d, 'time_of_issue'),
    clienteDireccion: leerTexto(d, 'customer_address'),
    leyendas: Array.isArray(d.legends) ? d.legends.map((l) => String(l)) : [],
    qr: leerTexto(d, 'qr_content'),
    hash: leerTexto(d, 'hash'),
    vendedor: leerTexto(d, 'seller'),
    condicionPago: leerTexto(d, 'payment_condition'),
    pagos: Array.isArray(d.payments)
      ? d.payments
          .filter((p): p is Fila => typeof p === 'object' && p !== null)
          .map((p) => ({ descripcion: leerTexto(p, 'descripcion'), monto: leerMonto(p, 'monto') }))
      : [],
    empresaNombre: leerTexto(empresa, 'nombre'),
    empresaRuc: leerTexto(empresa, 'ruc'),
    empresaDireccion: leerTexto(empresa, 'direccion'),
    urlConsulta: leerTexto(empresa, 'url_consulta'),
    logoBase64: leerTexto(empresa, 'logo_base64'),
    items,
  };
}
