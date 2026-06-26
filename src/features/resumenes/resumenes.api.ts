import { isAxiosError } from 'axios';

import { api } from '@/core/api/client';
import { EstadoResumen, ResumenEnviado } from './resumenes.types';

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
