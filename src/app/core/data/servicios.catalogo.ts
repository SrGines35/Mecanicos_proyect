import { Especialidad } from '../models';

export interface ServicioCatalogo {
  valor: Especialidad;
  nombre: string;
  /** Emoji para no depender todavia de una libreria de iconos */
  icono: string;
  descripcion: string;
}

/**
 * Catalogo de servicios que se puede pedir desde la app.
 * Lo usan la pantalla de inicio y el formulario de solicitud, asi que
 * si se agrega un servicio nuevo, se agrega aqui una sola vez.
 */
export const SERVICIOS: ServicioCatalogo[] = [
  {
    valor: 'general',
    nombre: 'Servicio general',
    icono: '🔧',
    descripcion: 'Revision, afinacion o cambio de aceite',
  },
  {
    valor: 'electrico',
    nombre: 'Electrico',
    icono: '⚡',
    descripcion: 'No arranca, bateria o sistema electrico',
  },
  {
    valor: 'llantas',
    nombre: 'Llantas',
    icono: '🛞',
    descripcion: 'Ponchadura, cambio o balanceo',
  },
  {
    valor: 'frenos',
    nombre: 'Frenos',
    icono: '🛑',
    descripcion: 'Balatas, discos o el pedal se siente raro',
  },
  {
    valor: 'motor',
    nombre: 'Motor',
    icono: '🔩',
    descripcion: 'Se calienta, hace ruido o pierde fuerza',
  },
  {
    valor: 'grua',
    nombre: 'Grua',
    icono: '🚛',
    descripcion: 'Necesitas que lo remolquen',
  },
];

/** Busca un servicio por su valor. Util para mostrar el nombre bonito. */
export function obtenerServicio(valor: Especialidad): ServicioCatalogo | undefined {
  return SERVICIOS.find((servicio) => servicio.valor === valor);
}
