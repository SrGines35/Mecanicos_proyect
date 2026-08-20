import { Routes } from '@angular/router';

import { invitadoGuard, rolGuard, sesionGuard } from './core/guards/sesion.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Oaxicanicos - Iniciar sesión',
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/registro/registro').then((m) => m.Registro),
    title: 'Oaxicanicos - Crear cuenta',
  },
  {
    path: 'cliente',
    canActivate: [sesionGuard, rolGuard('cliente')],
    loadComponent: () =>
      import('./features/cliente/inicio-cliente/inicio-cliente').then((m) => m.InicioCliente),
    title: 'Oaxicanicos - Inicio',
  },
  { path: '**', redirectTo: '' },
];
