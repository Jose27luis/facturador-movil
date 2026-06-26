import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { listarProductos } from './productos.api';

export function useProductos(input: string) {
  return useQuery({
    queryKey: ['productos', 'lista', input],
    queryFn: () => listarProductos(input),
    placeholderData: keepPreviousData,
  });
}
