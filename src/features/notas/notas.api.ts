import { api } from '@/core/api/client';
import { ItemDevolucion, NotaCreditoResultado, TipoNotaCredito } from './notas.types';

interface NotaResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    number?: string;
    state_type_id?: string;
    state_type_description?: string;
    message?: string;
    pdf_url?: string;
    pdf_ticket?: string;
  };
}

export async function crearNotaCredito(
  documentId: number,
  tipo: TipoNotaCredito,
  motivo: string,
  items?: ItemDevolucion[],
): Promise<NotaCreditoResultado> {
  const { data } = await api.post<NotaResponse>('/mobile/notas-credito', {
    document_id: documentId,
    tipo,
    motivo,
    ...(items && items.length > 0 ? { items } : {}),
  });
  if (!data.success || !data.data) {
    throw new Error(data.message || 'No se pudo emitir la nota de crédito.');
  }
  return {
    id: data.data.id ?? 0,
    numero: data.data.number ?? '',
    estadoId: data.data.state_type_id ?? '',
    estado: data.data.state_type_description ?? '',
    mensaje: data.data.message ?? 'Nota de crédito emitida.',
    pdfUrl: data.data.pdf_url ?? '',
    pdfTicket: data.data.pdf_ticket ?? '',
  };
}
