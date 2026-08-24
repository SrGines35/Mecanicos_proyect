import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Rol } from '../models/auth.model';
import { SesionService } from '../services/sesion.service';


export const sesionGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);

  if (sesion.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/']);
};


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


export const invitadoGuard: CanActivateFn = () => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const usuario = sesion.usuario();

  if (!usuario) {
    return true;
  }

  return router.createUrlTree([sesion.rutaSegunRol(usuario.role)]);
};
