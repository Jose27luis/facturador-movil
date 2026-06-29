import { useMutation, useQueryClient } from '@tanstack/react-query';

import { crearNotaCredito } from './notas.api';
import { TipoNotaCredito } from './notas.types';

export function useCrearNotaCredito() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      tipo,
      motivo,
    }: {
      documentId: number;
      tipo: TipoNotaCredito;
      motivo: string;
    }) => crearNotaCredito(documentId, tipo, motivo),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['ventas', 'lista'] });
    },
  });
}
