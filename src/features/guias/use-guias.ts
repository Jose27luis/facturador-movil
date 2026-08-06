import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { crearGuia, listarGuias, obtenerCatalogosGuia, obtenerDatosGuia } from './guias.api';
import { GuiaPayload } from './guias.types';

const claveLista = ['guias', 'lista'];

export function useCatalogosGuia() {
  return useQuery({
    queryKey: ['guias', 'catalogos'],
    queryFn: obtenerCatalogosGuia,
    staleTime: 10 * 60 * 1000,
  });
}

export function useDatosGuia(documentId: number) {
  return useQuery({
    queryKey: ['guias', 'documento', documentId],
    queryFn: () => obtenerDatosGuia(documentId),
    enabled: documentId > 0,
  });
}

export function useGuias() {
  return useQuery({
    queryKey: claveLista,
    queryFn: listarGuias,
  });
}

export function useCrearGuia() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (payload: GuiaPayload) => crearGuia(payload),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: claveLista });
    },
  });
}
