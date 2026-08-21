import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../models/auth.model';
import { SesionService } from '../services/sesion.service';

/**
 * Deja pasar solo si hay sesion iniciada.
 * Si no, manda al login.
 */
export const sesionGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  if (sesion.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/']);
};

/**
 * Deja pasar solo si la persona tiene el rol que se pide.
 * Si tiene el otro rol, lo manda a SU pantalla, no lo deja colado.
 *
 * Uso en las rutas:  canActivate: [sesionGuard, rolGuard('mecanico')]
 */
export const rolGuard = (rolPermitido: Rol): CanActivateFn => {
  return () => {
    const sesion = inject(SesionService);
    const router = inject(Router);
    const usuario = sesion.usuario();

    if (!usuario) {
      return router.createUrlTree(['/']);
    }

    if (usuario.role === rolPermitido) {
      return true;
    }

    return router.createUrlTree([sesion.rutaSegunRol(usuario.role)]);
  };
};

/**
 * Al reves: si YA hay sesion, no tiene caso mostrar el login ni el
 * registro. Lo manda directo a su pantalla.
 *
 * Esto es lo que hace que al abrir la app no te vuelva a pedir
 * iniciar sesion, como en Instagram.
 */
export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const usuario = sesion.usuario();

  if (!usuario) {
    return true;
  }

  return router.createUrlTree([sesion.rutaSegunRol(usuario.role)]);
};
