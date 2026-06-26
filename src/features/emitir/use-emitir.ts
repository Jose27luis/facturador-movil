import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  buscarClientes,
  buscarItems,
  consultarCliente,
  emitirDocumento,
  obtenerSeries,
} from './emitir.api';
import { EmitirPayload } from './emitir.types';

export function useSeries() {
  return useQuery({
    queryKey: ['emitir', 'series'],
    queryFn: obtenerSeries,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBuscarItems(input: string) {
  return useQuery({
    queryKey: ['emitir', 'items', input],
    queryFn: () => buscarItems(input),
  });
}

export function useConsultarCliente() {
  return useMutation({
    mutationFn: ({ numero, nombre }: { numero: string; nombre?: string }) =>
      consultarCliente(numero, nombre),
  });
}

export function useBuscarClientes(input: string, tipoId: string) {
  return useQuery({
    queryKey: ['emitir', 'clientes', tipoId, input],
    queryFn: () => buscarClientes(input, tipoId),
    enabled: input.trim().length >= 2,
  });
}

export function useEmitir() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmitirPayload) => emitirDocumento(payload),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['ventas', 'lista'] });
      void cliente.invalidateQueries({ queryKey: ['dashboard', 'report'] });
    },
  });
}
