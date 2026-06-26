export interface BarraDia {
  etiqueta: string;
  valor: number;
}

export interface ResumenDashboard {
  vendido: number;
  comprobantes: number;
  notasVenta: number;
  barras: BarraDia[];
}
