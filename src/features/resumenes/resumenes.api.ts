import { isAxiosError } from 'axios';

import { api } from '@/core/api/client';
import { BoletaPendiente, EstadoResumen, PreviewResumen, ResumenEnviado } from './resumenes.types';

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
