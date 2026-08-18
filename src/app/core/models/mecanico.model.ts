import { Ubicacion } from './ubicacion.model';

/**
 * Tipos de servicio que puede ofrecer un mecanico.
 * Si el back agrega mas, basta con extender este tipo.
 */
export type Especialidad =
  | 'general'
  | 'electrico'
  | 'llantas'
  | 'frenos'
  | 'motor'
  | 'grua';

export type EstadoMecanico = 'disponible' | 'ocupado' | 'desconectado';

export interface Mecanico {
  id: string;
  nombre: string;
  fotoUrl?: string;
  telefono: string;
  especialidades: Especialidad[];
  /** Promedio de calificacion de 0 a 5 */
  calificacion: number;
  totalServicios: number;
  /** Precio base de la visita, en pesos mexicanos */
  tarifaBase: number;
  estado: EstadoMecanico;
  ubicacion: Ubicacion;
  /** Anios de experiencia declarados por el mecanico */
  experiencia: number;
  descripcion?: string;
}

/**
 * Mecanico con la distancia ya calculada respecto al cliente.
 * Es lo que consume la pantalla de "mecanicos cercanos".
 */
export interface MecanicoCercano extends Mecanico {
  /** Distancia en kilometros hasta el cliente */
  distanciaKm: number;
  /** Tiempo estimado de llegada en minutos */
  tiempoEstimadoMin: number;
}
