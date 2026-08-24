export type EstadoMecanico = 'disponible' | 'ocupado' | 'no_disponible';

export interface PerfilMecanico {
  usuarioId: string;

  nombre?: string;
  telefono?: string;

  descripcion: string;
  latitud: number;
  longitud: number;
  zonaTrabajo: string;
  estado: EstadoMecanico;
  calificacion: number;
}

export type DatosPerfilMecanico = Omit<
  PerfilMecanico,
  'usuarioId' | 'calificacion' | 'estado' | 'nombre' | 'telefono'
>;

export interface MecanicoCercano extends PerfilMecanico {
  distanciaKm: number;
}

export const TEXTO_ESTADO: Record<EstadoMecanico, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  no_disponible: 'No disponible',
};

export const AYUDA_ESTADO: Record<EstadoMecanico, string> = {
  disponible: 'Apareces en el mapa y puedes recibir solicitudes.',
  ocupado: 'Estás atendiendo un servicio. No recibes solicitudes nuevas.',
  no_disponible: 'No apareces en las búsquedas.',
};
