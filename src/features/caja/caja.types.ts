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
