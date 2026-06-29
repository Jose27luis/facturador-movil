export interface MedioPagoResumen {
  id: string;
  descripcion: string;
  total: number;
  count: number;
}

export interface ResumenDia {
  fecha: string;
  total: number;
  totalDocumentos: number;
  totalNotasVenta: number;
  facturas: number;
  boletas: number;
  notasVenta: number;
  comprobantes: number;
  mediosPago: MedioPagoResumen[];
}

export interface ReportesCaja {
  a4: string;
  ticket: string;
  productos: string;
}

export interface EstadoCaja {
  abierta: boolean;
  cashId: number;
  fechaApertura: string;
  horaApertura: string;
  usuario: string;
  saldoInicial: number;
  ventas: number;
  comprobantes: number;
  esperadoEfectivo: number;
  esperadoTotal: number;
  mediosPago: MedioPagoResumen[];
  reportes: ReportesCaja;
}

export interface CierreCaja {
  saldoInicial: number;
  ventas: number;
  comprobantes: number;
  esperadoEfectivo: number;
  esperadoTotal: number;
  efectivoReal: number | null;
  diferencia: number | null;
  mediosPago: MedioPagoResumen[];
}
