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
    path: 'recuperar',
    canActivate: [invitadoGuard],
    loadComponent: () => import('./features/recuperar/recuperar').then((m) => m.Recuperar),
    title: 'Oaxicanicos - Recuperar contraseña',
  },
  {
    path: 'cliente',
    canActivate: [sesionGuard, rolGuard('cliente')],
    loadComponent: () =>
      import('./features/cliente/inicio-cliente/inicio-cliente').then((m) => m.InicioCliente),
    title: 'Oaxicanicos - Inicio',
  },
  {
    path: 'mecanico',
    canActivate: [sesionGuard, rolGuard('mecanico')],
    loadComponent: () =>
      import('./features/mecanico/panel/panel').then((m) => m.Panel),
    title: 'Oaxicanicos - Panel',
  },
  {
    path: 'mecanico/perfil',
    canActivate: [sesionGuard, rolGuard('mecanico')],
    loadComponent: () =>
      import('./features/mecanico/perfil/perfil').then((m) => m.Perfil),
    title: 'Oaxicanicos - Mi perfil',
  },
  {
    path: 'mecanico/solicitud/:id',
    canActivate: [sesionGuard, rolGuard('mecanico')],
    loadComponent: () =>
      import('./features/mecanico/detalle-solicitud/detalle-solicitud').then(
        (m) => m.DetalleSolicitud
      ),
    title: 'Oaxicanicos - Solicitud',
  },
  { path: '**', redirectTo: '' },
];
