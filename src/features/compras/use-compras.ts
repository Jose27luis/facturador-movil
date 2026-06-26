import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listarCompras } from './compras.api';

export function useCompras(input: string) {
  return useQuery({
    queryKey: ['compras', 'lista', input],
    queryFn: () => listarCompras(input),
    placeholderData: keepPreviousData,
  });
}
