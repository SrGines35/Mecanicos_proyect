
export type EstadoSolicitud =
  | 'pendiente'
  | 'aceptada'
  | 'en_camino'
  | 'en_proceso'
  | 'completada'
  | 'cancelada'
  | 'rechazada';


export interface ClienteSolicitud {
  nombre: string;
  telefono: string;
}

export interface Solicitud {
  id: string;
  usuarioId: string;
  mecanicoId: string | null;
  cliente: ClienteSolicitud;
  vehiculo: string;
  descripcionFalla: string;
  latitudOrigen: number;
  longitudOrigen: number;
  estado: EstadoSolicitud;
  costoPiezas: number;
  costoManoObra: number;
  tarifaApp: number;
  fechaCreacion: string;
}


export interface SolicitudCercana extends Solicitud {
  distanciaKm: number;
}

export const TEXTO_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptada',
  en_camino: 'En camino',
  en_proceso: 'En proceso',
  completada: 'Completada',
  cancelada: 'Cancelada',
  rechazada: 'Rechazada',
};


export const PASOS_SERVICIO: EstadoSolicitud[] = [
  'aceptada',
  'en_camino',
  'en_proceso',
  'completada',
];


export function siguientePaso(estado: EstadoSolicitud): EstadoSolicitud | null {
  const indice = PASOS_SERVICIO.indexOf(estado);
  if (indice === -1 || indice === PASOS_SERVICIO.length - 1) {
    return null;
  }
  return PASOS_SERVICIO[indice + 1];
}


export function calcularTotal(solicitud: Solicitud): number {
  return solicitud.costoPiezas + solicitud.costoManoObra + solicitud.tarifaApp;
}
