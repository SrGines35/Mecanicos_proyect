/** Los tres estados que puede tener un mecanico */
export type EstadoMecanico = 'disponible' | 'ocupado' | 'no_disponible';

/**
 * Perfil del mecanico. Lo llena el desde su panel, despues de
 * registrarse. Corresponde a la tabla perfiles_mecanico del back.
 */
export interface PerfilMecanico {
  usuarioId: string;

  /**
   * El nombre y el telefono viven en el usuario, no en el perfil. Aqui van
   * como opcionales porque el cliente necesita verlos al escoger mecanico,
   * y el back los manda junto con el perfil en /mecanicos/disponibles.
   */
  nombre?: string;
  telefono?: string;

  descripcion: string;
  latitud: number;
  longitud: number;
  zonaTrabajo: string;
  estado: EstadoMecanico;
  calificacion: number;
}

/** Lo que se manda a PUT /mecanicos/mi-perfil */
export type DatosPerfilMecanico = Omit<
  PerfilMecanico,
  'usuarioId' | 'calificacion' | 'estado' | 'nombre' | 'telefono'
>;

/** Un mecanico disponible con la distancia ya calculada por el front */
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
