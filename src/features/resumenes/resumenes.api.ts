import { isAxiosError } from 'axios';

import { api } from '@/core/api/client';
import {
  AnulacionResultado,
  BoletaPendiente,
  DocumentoAnulable,
  EstadoResumen,
  PreviewResumen,
  ResumenEnviado,
} from './resumenes.types';

function mensajeError(error: unknown, porDefecto: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) {
      return data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return porDefecto;
}

interface PreviewResponse {
  data?: {
    date?: string;
    count?: number;
    documents?: { number?: string; total?: number; currency_type_id?: string }[];
  };
}

export async function consultarPreview(fecha: string): Promise<PreviewResumen> {
  try {
    const { data } = await api.get<PreviewResponse>(`/mobile/summary-preview/${fecha}`);
    const d = data.data ?? {};
    const boletas: BoletaPendiente[] = (d.documents ?? []).map((b) => ({
      numero: b.number ?? '',
      total: typeof b.total === 'number' ? b.total : 0,
      moneda: b.currency_type_id ?? 'PEN',
    }));
    return { fecha: d.date ?? fecha, cantidad: d.count ?? boletas.length, boletas };
  } catch (error) {
    throw new Error(mensajeError(error, 'No se pudieron consultar las boletas.'));
  }
}

interface AnulablesResponse {
  data?: {
    documents?: {
      id?: number;
      number?: string;
      document_type_id?: string;
      document_type_description?: string;
      customer_name?: string;
      total?: number;
      currency_type_id?: string;
    }[];
  };
}

export async function obtenerAnulables(fecha: string): Promise<DocumentoAnulable[]> {
  try {
    const { data } = await api.get<AnulablesResponse>(`/mobile/voidables/${fecha}`);
    return (data.data?.documents ?? []).map((d) => ({
      id: typeof d.id === 'number' ? d.id : 0,
      numero: d.number ?? '',
      tipo: d.document_type_description ?? '',
      tipoId: d.document_type_id ?? '',
      cliente: d.customer_name ?? '',
      total: typeof d.total === 'number' ? d.total : 0,
      moneda: d.currency_type_id ?? 'PEN',
    }));
  } catch (error) {
    throw new Error(mensajeError(error, 'No se pudieron consultar los comprobantes.'));
  }
}

interface AnularResponse {
  success?: boolean;
  message?: string;
  data?: { tipo?: string; ticket?: string };
}

export async function anularDocumento(id: number, motivo: string): Promise<AnulacionResultado> {
  try {
    const { data } = await api.post<AnularResponse>('/mobile/anular', {
      document_id: id,
      motivo,
    });
    if (!data.success || !data.data) {
      throw new Error(data.message || 'No se pudo anular el comprobante.');
    }
    return { tipo: data.data.tipo ?? 'Anulación', ticket: data.data.ticket ?? '' };
  } catch (error) {
    throw new Error(mensajeError(error, 'No se pudo anular el comprobante.'));
  }
}

interface EnviarResponse {
  success?: boolean;
  data?: { external_id?: string; ticket?: string };
}

export async function enviarResumenDiario(fecha: string): Promise<ResumenEnviado> {
  try {
    const { data } = await api.post<EnviarResponse>('/summaries', {
      fecha_de_emision_de_documentos: fecha,
      codigo_tipo_proceso: '1',
    });
    if (!data.success || !data.data?.ticket) {
      throw new Error('No se pudo generar el resumen.');
    }
    return { externalId: data.data.external_id ?? '', ticket: data.data.ticket };
  } catch (error) {
    throw new Error(mensajeError(error, 'No se pudo generar el resumen.'));
  }
}

interface EstadoResponse {
  success?: boolean;
  response?: { sent?: boolean; description?: string; code?: string };
}

export async function consultarResumen(ticket: string): Promise<EstadoResumen> {
  try {
    const { data } = await api.post<EstadoResponse>('/summaries/status', { ticket });
    const r = data.response ?? {};
    return {
      enviado: Boolean(r.sent),
      descripcion: r.description || (r.sent ? 'Aceptado por SUNAT' : 'En proceso'),
    };
  } catch (error) {
    throw new Error(mensajeError(error, 'No se pudo consultar el estado.'));
  }
}
