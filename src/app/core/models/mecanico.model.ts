export interface Mecanico {

  id: string;

  nombre: string;

  latitud: number;

  longitud: number;

  calificacion: number;

  estado: 'disponible' | 'ocupado' | 'no_disponible';

  distancia?: number;

}