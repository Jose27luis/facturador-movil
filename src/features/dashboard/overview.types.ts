export interface Conteos {
  facturas: number;
  boletas: number;
  notasVenta: number;
}

export type SeveridadAlerta = 'danger' | 'warning' | 'info';

export interface Alerta {
  id: string;
  severity: SeveridadAlerta;
  title: string;
  detail: string;
  count: number;
}

export interface Overview {
  conteos: Conteos;
  alertas: Alerta[];
}
