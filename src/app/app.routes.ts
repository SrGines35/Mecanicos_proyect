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
  {
    path: 'mecanicos/:id',
    loadComponent: () =>
      import('./features/detalle-mecanico/detalle-mecanico').then((m) => m.DetalleMecanico),
    title: 'Detalle del mecanico',
  },
  {
    path: 'seguimiento/:id',
    loadComponent: () => import('./features/seguimiento/seguimiento').then((m) => m.Seguimiento),
    title: 'Seguimiento del servicio',
  },
  // Cualquier ruta que no exista regresa al inicio
  { path: '**', redirectTo: '' },
];
