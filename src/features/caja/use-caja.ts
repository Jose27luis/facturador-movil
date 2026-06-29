import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { abrirCaja, cerrarCaja, obtenerEstadoCaja, obtenerResumenDia } from './caja.api';

export function useResumenDia(fecha: string) {
  return useQuery({
    queryKey: ['caja', 'resumen', fecha],
    queryFn: () => obtenerResumenDia(fecha),
    enabled: fecha.length === 10,
  });
}

export function useEstadoCaja() {
  return useQuery({
    queryKey: ['caja', 'estado'],
    queryFn: obtenerEstadoCaja,
  });
}

export function useAbrirCaja() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (saldoInicial: number) => abrirCaja(saldoInicial),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['caja', 'estado'] });
    },
  });
}

export function useCerrarCaja() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (efectivoReal: number | null) => cerrarCaja(efectivoReal),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['caja', 'estado'] });
    },
  });
}
