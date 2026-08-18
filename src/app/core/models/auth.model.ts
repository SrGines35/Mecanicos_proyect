/**
 * Modelos de autenticacion.
 * Esta es la forma que debe tener lo que mande y devuelva el back.
 */

export type Rol = 'usuario' | 'mecanico';

export type Especialidad = 'general' | 'electrico' | 'llantas' | 'frenos' | 'motor' | 'grua';

/** Lo que se manda a POST /auth/login */
export interface Credenciales {
  correo: string;
  contrasena: string;
}

/** Campos que comparten los dos registros */
interface RegistroBase {
  nombre: string;
  correo: string;
  telefono: string;
  contrasena: string;
}

/** POST /auth/registro/usuario */
export interface RegistroUsuario extends RegistroBase {
  rol: 'usuario';
}

/** POST /auth/registro/mecanico */
export interface RegistroMecanico extends RegistroBase {
  rol: 'mecanico';
  especialidades: Especialidad[];
  experiencia: number;
  tarifaBase: number;
  zonaTrabajo: string;
}

export type DatosRegistro = RegistroUsuario | RegistroMecanico;

/** Lo que el back debe devolver al iniciar sesion o registrarse */
export interface SesionUsuario {
  token: string;
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}
