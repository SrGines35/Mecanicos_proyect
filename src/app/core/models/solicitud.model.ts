import { Especialidad } from './mecanico.model';
import { Ubicacion } from './ubicacion.model';

export type EstadoSolicitud =
  | 'buscando'
  | 'aceptada'
  | 'en-camino'
  | 'atendiendo'
  | 'finalizada'
  | 'cancelada';

/**
 * Lo que el cliente llena antes de buscar un mecanico.
 */
export interface NuevaSolicitud {
  tipoServicio: Especialidad;
  descripcionProblema: string;
  ubicacion: Ubicacion;
  vehiculo: string;
}

/**
 * Solicitud ya creada. Cuando el back este listo, esta interfaz
 * deberia coincidir con lo que devuelva el endpoint /solicitudes.
 */
export interface Solicitud extends NuevaSolicitud {
  id: string;
  mecanicoId?: string;
  estado: EstadoSolicitud;
  fechaCreacion: Date;
  costoEstimado?: number;
}
