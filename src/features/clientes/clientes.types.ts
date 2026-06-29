export interface ClienteListado {
  id: number;
  nombre: string;
  numero: string;
  descripcion: string;
}

export interface ClienteDatos {
  id: number;
  nombre: string;
  numero: string;
  tipoDocumento: string;
  direccion: string;
  telefono: string;
  email: string;
}

export interface CompraHistorial {
  id: number;
  numero: string;
  tipoId: string;
  tipo: string;
  fecha: string;
  total: number;
  moneda: string;
  estadoId: string;
  estado: string;
  esNotaVenta: boolean;
}

export interface HistorialCliente {
  cliente: ClienteDatos;
  totalComprado: number;
  comprobantes: number;
  ultimaCompra: string | null;
  historial: CompraHistorial[];
}
