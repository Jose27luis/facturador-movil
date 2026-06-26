import { useQuery } from '@tanstack/react-query';

import { listarComprobantes, obtenerComprobanteDetalle } from './ventas.api';
import { Comprobante } from './ventas.types';

const claveLista = ['ventas', 'lista'];

export function useComprobantes() {
  return useQuery<Comprobante[]>({
    queryKey: claveLista,
    queryFn: listarComprobantes,
  });
}

export function useComprobante(id: number) {
  return useQuery<Comprobante[], Error, Comprobante | undefined>({
    queryKey: claveLista,
    queryFn: listarComprobantes,
    select: (lista) => lista.find((c) => c.id === id),
  });
}

export function useComprobanteDetalle(id: number) {
  return useQuery({
    queryKey: ['ventas', 'detalle', id],
    queryFn: () => obtenerComprobanteDetalle(id),
    enabled: id > 0,
  });
}
