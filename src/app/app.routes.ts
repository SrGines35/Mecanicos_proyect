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
    path: 'usuario',
    canActivate: [sesionGuard, rolGuard('cliente')],
    loadComponent: () =>
      import('./features/usuario/layout/layout').then((m) => m.Layout),
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () => import('./features/usuario/home/home').then((m) => m.Home),
        title: 'Oaxicanicos - Inicio',
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/usuario/perfil/perfil').then((m) => m.Perfil),
        title: 'Oaxicanicos - Mi perfil',
      },
      {
        path: 'solicitar-servicio',
        loadComponent: () =>
          import('./features/usuario/solicitar-servicio/solicitar-servicio').then(
            (m) => m.SolicitarServicio
          ),
        title: 'Oaxicanicos - Solicitar servicio',
      },
    ],
  },

  {
    path: 'mecanico',
    canActivate: [sesionGuard, rolGuard('mecanico')],
    loadComponent: () => import('./features/mecanico/panel/panel').then((m) => m.Panel),
    title: 'Oaxicanicos - Panel',
  },
  {
    path: 'mecanico/perfil',
    canActivate: [sesionGuard, rolGuard('mecanico')],
    loadComponent: () => import('./features/mecanico/perfil/perfil').then((m) => m.Perfil),
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

  {
    path: '**',
    loadComponent: () =>
      import('./features/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
    title: 'Oaxicanicos - Página no encontrada',
  },
];
