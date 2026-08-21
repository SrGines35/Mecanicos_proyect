import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Menu fijo de abajo, como el de las apps del celular.
 *
 * Antes, para moverse entre el panel y el perfil habia que buscar una
 * tarjeta o la flecha de regresar. Con esto siempre esta a la mano y se ve
 * en cual de las dos estas parado.
 *
 * routerLinkActive es lo que marca la opcion actual. En Inicio se usa
 * exact: true porque si no, /mecanico/perfil tambien haria que Inicio se
 * viera activo (perfil empieza con /mecanico).
 */
@Component({
  selector: 'app-menu-inferior',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu-inferior.html',
  styleUrl: './menu-inferior.css',
})
export class MenuInferior {}
