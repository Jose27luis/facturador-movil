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
