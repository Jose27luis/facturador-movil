import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listarComprobantes, obtenerComprobanteDetalle, reenviarDocumento } from './ventas.api';
import { Comprobante } from './ventas.types';

const claveLista = ['ventas', 'lista'];

export function useComprobantes() {
  return useQuery<Comprobante[]>({
    queryKey: claveLista,
    queryFn: listarComprobantes,
  });
}

export function useComprobante(id: number, esNotaVenta: boolean) {
  return useQuery<Comprobante[], Error, Comprobante | undefined>({
    queryKey: claveLista,
    queryFn: listarComprobantes,
    select: (lista) => lista.find((c) => c.id === id && c.esNotaVenta === esNotaVenta),
  });
}

export function useComprobanteDetalle(id: number, esNotaVenta: boolean) {
  return useQuery({
    queryKey: ['ventas', 'detalle', esNotaVenta ? 'nv' : 'doc', id],
    queryFn: () => obtenerComprobanteDetalle(id, esNotaVenta),
    enabled: id > 0,
  });
}

export function useReenviar() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => reenviarDocumento(id),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveLista });
      void cliente.invalidateQueries({ queryKey: ['ventas', 'detalle'] });
    },
  });
}
