import { useMutation } from '@tanstack/react-query';

import { consultarResumen, enviarResumenDiario } from './resumenes.api';

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
