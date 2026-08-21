/**
 * Configuracion del ambiente.
 *
 * INTERRUPTOR PRINCIPAL: mientras el back no este arriba, dejar
 * `usarApiReal` en false y la app trabaja con datos simulados.
 * Cuando el back este listo, se pone en true y ya. No hay que
 * tocar nada mas.
 */
export const environment = {
  usarApiReal: false,
  apiUrl: 'http://localhost:3000',
};
