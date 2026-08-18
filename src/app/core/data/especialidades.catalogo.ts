import { Especialidad } from '../models/auth.model';

export interface OpcionEspecialidad {
  valor: Especialidad;
  nombre: string;
}

/**
 * Especialidades que puede marcar un mecanico al registrarse.
 * Si se agrega una nueva, se agrega aqui una sola vez.
 */
export const ESPECIALIDADES: OpcionEspecialidad[] = [
  { valor: 'general', nombre: 'Servicio general' },
  { valor: 'electrico', nombre: 'Electrico' },
  { valor: 'llantas', nombre: 'Llantas' },
  { valor: 'frenos', nombre: 'Frenos' },
  { valor: 'motor', nombre: 'Motor' },
  { valor: 'grua', nombre: 'Grua' },
];
