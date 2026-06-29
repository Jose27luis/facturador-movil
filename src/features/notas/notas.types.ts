export type TipoNotaCredito = '01' | '06' | '03' | '07';

export interface OpcionNotaCredito {
  id: TipoNotaCredito;
  etiqueta: string;
  detalle: string;
}

export const TIPOS_NOTA_CREDITO: OpcionNotaCredito[] = [
  { id: '06', etiqueta: 'Devolución total', detalle: 'Se devuelve el total de la venta.' },
  { id: '07', etiqueta: 'Devolución por ítem', detalle: 'Elige qué ítems y cantidades devolver.' },
  { id: '01', etiqueta: 'Anulación de la operación', detalle: 'La venta queda sin efecto.' },
  {
    id: '03',
    etiqueta: 'Corrección de descripción',
    detalle: 'Corrige datos sin cambiar los importes.',
  },
];

export interface ItemDevolucion {
  id: number;
  quantity: number;
}

export interface NotaCreditoResultado {
  id: number;
  numero: string;
  estadoId: string;
  estado: string;
  mensaje: string;
  pdfUrl: string;
  pdfTicket: string;
}
