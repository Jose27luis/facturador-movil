import { useMutation } from '@tanstack/react-query';

import { consultarPreview, consultarResumen, enviarResumenDiario } from './resumenes.api';

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
