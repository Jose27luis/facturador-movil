import { useQuery } from '@tanstack/react-query';

import { buscarClientes, obtenerHistorial } from './clientes.api';

export function useBuscarClientes(input: string) {
  return useQuery({
    queryKey: ['clientes', 'buscar', input],
    queryFn: () => buscarClientes(input),
    enabled: input.trim().length >= 2,
  });
}

export function useHistorialCliente(id: number) {
  return useQuery({
    queryKey: ['clientes', 'historial', id],
    queryFn: () => obtenerHistorial(id),
    enabled: id > 0,
  });
}
