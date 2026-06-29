import { useQuery } from '@tanstack/react-query';

import { obtenerResumenDia } from './caja.api';

export function useResumenDia(fecha: string) {
  return useQuery({
    queryKey: ['caja', 'resumen', fecha],
    queryFn: () => obtenerResumenDia(fecha),
    enabled: fecha.length === 10,
  });
}
