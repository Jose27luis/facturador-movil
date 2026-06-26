import { api } from '@/core/api/client';
import { Alerta, Overview, SeveridadAlerta } from './overview.types';

interface OverviewResponse {
  data?: {
    counts?: { facturas?: number; boletas?: number; notas_venta?: number };
    alerts?: {
      id?: string;
      severity?: string;
      title?: string;
      detail?: string;
      count?: number;
    }[];
  };
}

function num(valor: number | undefined): number {
  return typeof valor === 'number' ? valor : 0;
}

function severidad(valor: string | undefined): SeveridadAlerta {
  if (valor === 'danger' || valor === 'warning' || valor === 'info') {
    return valor;
  }
  return 'info';
}

export async function obtenerOverview(): Promise<Overview> {
  const { data } = await api.get<OverviewResponse>('/mobile/overview');
  const counts = data.data?.counts ?? {};
  const alerts = data.data?.alerts ?? [];
  const alertas: Alerta[] = alerts.map((a) => ({
    id: a.id ?? '',
    severity: severidad(a.severity),
    title: a.title ?? '',
    detail: a.detail ?? '',
    count: num(a.count),
  }));
  return {
    conteos: {
      facturas: num(counts.facturas),
      boletas: num(counts.boletas),
      notasVenta: num(counts.notas_venta),
    },
    alertas,
  };
}
