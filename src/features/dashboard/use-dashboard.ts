import { useQuery } from '@tanstack/react-query';

import { obtenerReporte } from './dashboard.api';
import { ReporteGeneral, ResumenDashboard } from './dashboard.types';

function leerNumero(general: ReporteGeneral, claves: string[]): number {
  for (const clave of claves) {
    const valor = general[clave];
    if (typeof valor === 'number') {
      return valor;
    }
    if (typeof valor === 'string' && valor.trim() !== '' && !Number.isNaN(Number(valor))) {
      return Number(valor);
    }
  }
  return 0;
}

export function useDashboard() {
  return useQuery<ResumenDashboard>({
    queryKey: ['dashboard', 'report'],
    queryFn: async () => {
      const general = await obtenerReporte();
      const vendido = leerNumero(general, ['total', 'total_pen', 'total_venta', 'sale_total']);
      const comprobantes = leerNumero(general, [
        'quantity_documents',
        'total_documents',
        'documents',
        'count',
      ]);
      return {
        vendido,
        comprobantes,
        ticketPromedio: comprobantes > 0 ? vendido / comprobantes : 0,
      };
    },
  });
}
