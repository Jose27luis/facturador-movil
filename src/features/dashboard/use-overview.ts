import { useQuery } from '@tanstack/react-query';

import { obtenerOverview } from './overview.api';
import { Overview } from './overview.types';

export function useOverview() {
  return useQuery<Overview>({
    queryKey: ['dashboard', 'overview'],
    queryFn: obtenerOverview,
  });
}
