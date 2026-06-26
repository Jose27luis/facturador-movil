export interface ResumenEnviado {
  externalId: string;
  ticket: string;
}

export interface EstadoResumen {
  enviado: boolean;
  descripcion: string;
}

export interface BoletaPendiente {
  numero: string;
  total: number;
  moneda: string;
}

export interface PreviewResumen {
  fecha: string;
  cantidad: number;
  boletas: BoletaPendiente[];
}
