import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';

import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';

/**
 * Marco de las pantallas del cliente.
 *
 * Trae la barra de arriba (titulo, nombre y Salir), el menu fijo de abajo,
 * y en medio el <router-outlet> donde se dibujan home, perfil y
 * solicitar-servicio.
 *
 * El titulo cambia solo segun la ruta en la que estemos. Se calcula con un
 * computed a partir de la direccion actual, para no tener que repetir la
 * barra en cada pantalla.
 */
@Component({
  selector: 'app-layout',
  imports: [BarraSuperior, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly router = inject(Router);

  /**
   * La direccion actual, como signal.
   *
   * El router avisa de los cambios con un Observable. toSignal lo convierte
   * en signal para que el template se entere solo: la app corre sin zone.js,
   * asi que un valor que llega despues SOLO repinta la pantalla si vive
   * dentro de un signal.
   */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  /** Titulo que se muestra en la barra de arriba */
  protected readonly titulo = computed(() => {
    const url = this.url();

    if (url.startsWith('/usuario/perfil')) {
      return 'Mi perfil';
    }

    if (url.startsWith('/usuario/solicitar-servicio')) {
      return 'Solicitar servicio';
    }

    return 'Inicio';
  });

  /** En home no hay a donde regresar: es la pantalla de entrada */
  protected readonly mostrarRegresar = computed(() => {
    const url = this.url();
    return !(url === '/usuario' || url.startsWith('/usuario/home'));
  });
}
