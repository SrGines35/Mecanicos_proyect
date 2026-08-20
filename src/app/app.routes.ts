import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/login/login').then((m) => m.Login),
    title: 'Oaxicanicos - Iniciar sesión',
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/registro/registro').then((m) => m.Registro),
    title: 'Oaxicanicos - Crear cuenta',
  },

  {
    path: 'usuario',
    loadComponent: () =>
      import('./features/usuario/layout/layout').then((m) => m.Layout),
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () => import('./features/usuario/inicio/inicio').then((m) => m.Inicio),
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/usuario/perfil/perfil').then((m) => m.Perfil),
      },
      {
        path: 'vehiculos',loadComponent: () => import('./features/usuario/vehiculos/vehiculos').then((m) => m.Vehiculos),
      },
      {
        path: 'configuracion',loadComponent: () => import('./features/usuario/configuracion/configuracion').then((m) => m.Configuracion),
      },
      {
        path: 'solicitar-servicio',loadComponent: () => import('./features/usuario/solicitar-servicio/solicitar-servicio').then((m) => m.SolicitarServicio),
      },
    ],
  },
  { path: '**', redirectTo: '' },


];


