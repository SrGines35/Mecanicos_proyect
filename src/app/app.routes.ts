import { Routes } from '@angular/router';

import { invitadoGuard, rolGuard, sesionGuard } from './core/guards/sesion.guard';

/**
 * Rutas de toda la app: las del cliente (Luz) y las del mecanico (Freidy).
 *
 * Este archivo es el UNICO que tocamos los dos, asi que se avisa antes de
 * moverle. Si los dos lo cambian al mismo tiempo, git marca conflicto.
 *
 * Nota sobre los nombres: la RUTA del cliente es /usuario, pero el ROL que
 * manda el back es 'cliente'. Son dos cosas distintas a proposito: el rol
 * esta acordado con el equipo de back y no se toca.
 */
export const routes: Routes = [
  // ----------------------------------------------------------------
  // Publicas. invitadoGuard evita que se muestren si ya hay sesion.
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Cliente (Luz)
  //
  // El layout trae el menu de abajo y un <router-outlet> donde se
  // dibujan las pantallas hijas. Los guards van en el padre: al
  // protegerlo, quedan protegidas todas las hijas.
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Mecanico (Freidy)
  // ----------------------------------------------------------------
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

  // ----------------------------------------------------------------
  // Cualquier direccion que no exista
  // ----------------------------------------------------------------
  {
    path: '**',
    loadComponent: () =>
      import('./features/no-encontrada/no-encontrada').then((m) => m.NoEncontrada),
    title: 'Oaxicanicos - Página no encontrada',
  },
];
