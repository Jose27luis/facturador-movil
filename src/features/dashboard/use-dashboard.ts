import { useQuery } from '@tanstack/react-query';

import { obtenerReporte } from './dashboard.api';
import { ResumenDashboard } from './dashboard.types';

export function useDashboard() {
  return useQuery<ResumenDashboard>({
    queryKey: ['dashboard', 'report'],
    queryFn: obtenerReporte,
  });
}
