import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  actualizarProducto,
  crearProducto,
  desactivarProducto,
  EditarProducto,
  listarProductos,
  NuevoProducto,
} from './productos.api';

export function useProductos(input: string) {
  return useQuery({
    queryKey: ['productos', 'lista', input],
    queryFn: () => listarProductos(input),
    placeholderData: keepPreviousData,
  });
}

export function useCrearProducto() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (payload: NuevoProducto) => crearProducto(payload),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useActualizarProducto() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EditarProducto }) =>
      actualizarProducto(id, payload),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}

export function useDesactivarProducto() {
  const cliente = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => desactivarProducto(id),
    onSuccess: () => {
      void cliente.invalidateQueries({ queryKey: ['productos'] });
    },
  });
}
