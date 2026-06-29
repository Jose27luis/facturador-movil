import { useMutation, useQueryClient } from '@tanstack/react-query';

import { crearNotaCredito } from './notas.api';
import { ItemDevolucion, TipoNotaCredito } from './notas.types';

export function useCrearNotaCredito() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      tipo,
      motivo,
      items,
    }: {
      documentId: number;
      tipo: TipoNotaCredito;
      motivo: string;
      items?: ItemDevolucion[];
    }) => crearNotaCredito(documentId, tipo, motivo, items),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['ventas', 'lista'] });
    },
  });
}
