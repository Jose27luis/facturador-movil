import { useMutation } from '@tanstack/react-query';

import {
  anularDocumento,
  consultarPreview,
  consultarResumen,
  enviarResumenDiario,
  obtenerAnulables,
} from './resumenes.api';

export function useConsultarPreview() {
  return useMutation({
    mutationFn: (fecha: string) => consultarPreview(fecha),
  });
}

export function useEnviarResumen() {
  return useMutation({
    mutationFn: (fecha: string) => enviarResumenDiario(fecha),
  });
}

export function useConsultarResumen() {
  return useMutation({
    mutationFn: (ticket: string) => consultarResumen(ticket),
  });
}

export function useAnulables() {
  return useMutation({
    mutationFn: (fecha: string) => obtenerAnulables(fecha),
  });
}

export function useAnular() {
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) => anularDocumento(id, motivo),
  });
}
