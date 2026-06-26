import { api } from '@/core/api/client';
import { BarraDia, ResumenDashboard } from './dashboard.types';

interface Totals {
  total?: string | number;
  total_documents?: string | number;
  total_sale_notes?: string | number;
}

interface Dataset {
  label?: string;
  data?: number[];
}

interface Graph {
  labels?: string[];
  datasets?: Dataset[];
}

interface ReportResponse {
  data?: { general?: { totals?: Totals; graph?: Graph } };
}

function num(valor: string | number | undefined): number {
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim() !== '' && !Number.isNaN(Number(valor))) {
    return Number(valor);
  }
  return 0;
}

function construirBarras(graph: Graph | undefined): BarraDia[] {
  const labels = graph?.labels ?? [];
  const total = graph?.datasets?.find((d) => d.label === 'Total') ?? graph?.datasets?.[0];
  const datos = total?.data ?? [];
  return labels.map((etiqueta, i) => ({
    etiqueta: etiqueta.replace(/[^0-9]/g, ''),
    valor: typeof datos[i] === 'number' ? datos[i] : 0,
  }));
}

export async function obtenerReporte(): Promise<ResumenDashboard> {
  const { data } = await api.get<ReportResponse>('/report');
  const general = data.data?.general ?? {};
  const totals = general.totals ?? {};
  return {
    vendido: num(totals.total),
    comprobantes: num(totals.total_documents),
    notasVenta: num(totals.total_sale_notes),
    barras: construirBarras(general.graph),
  };
}
