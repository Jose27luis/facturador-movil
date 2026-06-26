export type Periodo = 'today' | 'week' | 'month';

export interface ReporteGeneral {
  [key: string]: unknown;
}

export interface ResumenDashboard {
  vendido: number;
  comprobantes: number;
  ticketPromedio: number;
}

export const PERIODOS: { id: Periodo; etiqueta: string }[] = [
  { id: 'today', etiqueta: 'Hoy' },
  { id: 'week', etiqueta: 'Semana' },
  { id: 'month', etiqueta: 'Mes' },
];
