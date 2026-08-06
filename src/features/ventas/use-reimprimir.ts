import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/core/auth/session';
import { imprimirTicket } from '@/core/printer/printer';
import { usePrinter } from '@/core/printer/printer-store';
import { obtenerComprobanteDetalle } from './ventas.api';
import { ComprobanteDetalle } from './ventas.types';

interface ReimpresionEnCurso {
  id: number;
  esNotaVenta: boolean;
}

export function useReimprimir() {
  const cliente = useQueryClient();
  const usuario = useSession((s) => s.usuario);
  const impresoraActiva = usePrinter((s) => s.activa);
  const [enCurso, setEnCurso] = useState<ReimpresionEnCurso | null>(null);

  async function reimprimir(id: number, esNotaVenta: boolean): Promise<void> {
    if (!impresoraActiva || enCurso !== null) {
      return;
    }
    setEnCurso({ id, esNotaVenta });
    try {
      const detalle = await cliente.fetchQuery<ComprobanteDetalle>({
        queryKey: ['ventas', 'detalle', esNotaVenta ? 'nv' : 'doc', id],
        queryFn: () => obtenerComprobanteDetalle(id, esNotaVenta),
        staleTime: 60000,
      });
      await imprimirTicket(impresoraActiva, {
        empresa: usuario?.nombre || 'Amantix',
        ruc: usuario?.ruc,
        tipo: detalle.tipo,
        numero: detalle.numero,
        fecha: detalle.fecha,
        cliente: detalle.cliente || 'Cliente varios',
        clienteDoc: detalle.clienteDoc,
        clienteDireccion: detalle.clienteDireccion,
        hora: detalle.hora,
        leyendas: detalle.leyendas,
        qr: detalle.qr,
        items: detalle.items.map((it) => ({
          nombre: it.descripcion,
          cantidad: it.cantidad,
          precio: it.precioUnitario,
          total: it.total,
          unidad: it.unidad,
          codigo: it.codigo,
        })),
        gravado: detalle.totalGravado,
        exonerado: detalle.totalExonerado,
        igv: detalle.totalIgv,
        total: detalle.total,
        moneda: detalle.moneda,
        estado: detalle.estado,
      });
    } finally {
      setEnCurso(null);
    }
  }

  return {
    reimprimir,
    impresoraActiva,
    enCurso,
    estaImprimiendo: (id: number, esNotaVenta: boolean) =>
      enCurso !== null && enCurso.id === id && enCurso.esNotaVenta === esNotaVenta,
  };
}
