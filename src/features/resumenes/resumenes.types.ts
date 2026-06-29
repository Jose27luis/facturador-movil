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

export interface DocumentoAnulable {
  id: number;
  numero: string;
  tipo: string;
  tipoId: string;
  cliente: string;
  total: number;
  moneda: string;
}

export interface AnulacionResultado {
  tipo: string;
  ticket: string;
}
