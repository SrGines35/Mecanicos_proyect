/**
 * Modelos de autenticacion.
 * Esta es la forma que debe tener lo que mande y devuelva el back.
 */

export type Rol = 'usuario' | 'mecanico';

/** Lo que se manda a POST /auth/login */
export interface Credenciales {
  correo: string;
  contrasena: string;
}

/**
 * Lo que se manda a POST /auth/registro.
 * Los dos roles piden exactamente los mismos datos. Lo que distingue a un
 * mecanico (descripcion, ubicacion, especialidades, precio) se llena
 * despues, desde su perfil en el dashboard.
 */
export interface DatosRegistro {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
  rol: Rol;
}

/** Lo que el back debe devolver al iniciar sesion o registrarse */
export interface SesionUsuario {
  token: string;
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}
