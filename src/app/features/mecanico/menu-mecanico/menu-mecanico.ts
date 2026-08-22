import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Menu fijo de abajo del mecanico, como el de las apps del celular.
 *
 * Antes vivia en shared/ y se llamaba menu-inferior, pero ahi estaba mal
 * puesto: las rutas que trae adentro (/mecanico, /mecanico/historial,
 * /mecanico/perfil) son de una sola parte de la app. Un componente de
 * shared/ tiene que servirle a cualquiera, y este no. El cliente tiene su
 * propio menu dentro de su layout.
 *
 * routerLinkActive es lo que marca la opcion actual. En Inicio se usa
 * exact: true porque si no, /mecanico/perfil tambien haria que Inicio se
 * viera activo: las dos direcciones empiezan con /mecanico.
 */
@Component({
  selector: 'app-menu-mecanico',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-mecanico.html',
  styleUrl: './menu-mecanico.css',
})
export class MenuMecanico {}
