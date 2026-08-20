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
  { path: '**', redirectTo: '' },
];
