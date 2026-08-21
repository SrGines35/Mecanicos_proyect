/**
 * Modelos de autenticacion.
 *
 * Los nombres de los campos son EXACTAMENTE los que usa el back
 * (repo App_Mecanicos, rama Dropxni). Si algo aqui no coincide
 * con lo de alla, la app truena aunque el codigo este bien.
 */

export type Rol = 'cliente' | 'mecanico';

/** Body de POST /auth/login */
export interface Credenciales {
  correo: string;
  password: string;
}

/** Body de POST /auth/register */
export interface DatosRegistro {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  role: Rol;
}

/** El usuario tal como lo devuelve el back */
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string;
  role: Rol;
}

/** Los dos tokens que devuelve el back */
export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

/** Respuesta de /auth/register y /auth/login */
export interface RespuestaAuth {
  user: Usuario;
  tokens: Tokens;
}
