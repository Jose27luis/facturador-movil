export interface ResumenEnviado {
  externalId: string;
  ticket: string;
}

export interface EstadoResumen {
  enviado: boolean;
  descripcion: string;
}
