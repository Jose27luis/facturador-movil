import { useQuery } from '@tanstack/react-query';

import { listarComprobantes } from './ventas.api';
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
