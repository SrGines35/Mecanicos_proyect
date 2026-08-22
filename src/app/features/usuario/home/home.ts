import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SesionService } from '../../../core/services/sesion.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  /**
   * De aqui sale quien inicio sesion. Es el mismo servicio que ya usan el
   * login y el registro; no se crea nada nuevo ni se toca el servicio.
   */
  private readonly sesion = inject(SesionService);

  /**
   * Se conserva el nombre de siempre: nombreUsuario.
   *
   * Lo unico que cambia es de donde sale el valor. Antes estaba escrito a
   * mano ('Usuario'); ahora se lee de la sesion del usuario autenticado.
   *
   * Es un computed y no una propiedad normal porque la app corre sin
   * zone.js: un valor que llega despues solo repinta la pantalla si vive
   * dentro de un signal.
   *
   * Se muestra solo el primer nombre, porque "Hola, Ana" se lee mejor que
   * "Hola, Ana Maria Gutierrez Solis". El 'Usuario' del final es el respaldo
   * para el instante en que la sesion todavia no termina de cargar.
   */
  protected readonly nombreUsuario = computed(
    () => this.sesion.usuario()?.nombre?.trim().split(' ')[0] || 'Usuario'
  );
}
