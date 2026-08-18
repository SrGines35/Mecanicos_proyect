import { Routes } from '@angular/router';

/**
 * Rutas de la aplicacion.
 * Se usan loadComponent (lazy loading) para que el bundle inicial sea chico:
 * cada pantalla se descarga solo cuando el usuario entra a ella.
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/inicio/inicio').then((m) => m.Inicio),
    title: 'MecaGo - Inicio',
  },
  {
    path: 'solicitar',
    loadComponent: () => import('./features/solicitar/solicitar').then((m) => m.Solicitar),
    title: 'Solicitar mecanico',
  },
  {
    path: 'mecanicos',
    loadComponent: () =>
      import('./features/mecanicos-cercanos/mecanicos-cercanos').then((m) => m.MecanicosCercanos),
    title: 'Mecanicos cerca de ti',
  },
  // Cualquier ruta que no exista regresa al inicio
  { path: '**', redirectTo: '' },
];
