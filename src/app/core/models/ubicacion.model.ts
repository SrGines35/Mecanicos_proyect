/**
 * Representa un punto geografico dentro de la aplicacion.
 * Se usa tanto para la ubicacion del cliente como para la del mecanico.
 */
export interface Ubicacion {
  latitud: number;
  longitud: number;
  /** Texto legible para mostrar en pantalla, ej. "Av. Universidad 120, Oaxaca" */
  direccion?: string;
}
