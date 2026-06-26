import { api } from '@/core/api/client';
import { ReporteGeneral } from './dashboard.types';

interface ReportResponse {
  data?: { general?: ReporteGeneral };
}

export async function obtenerReporte(): Promise<ReporteGeneral> {
  const { data } = await api.get<ReportResponse>('/report');
  return data.data?.general ?? {};
}
