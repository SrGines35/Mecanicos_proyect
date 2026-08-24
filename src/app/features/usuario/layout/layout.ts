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

@Component({
  selector: 'app-layout',
  imports: [BarraSuperior, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((evento) => evento instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

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

  protected readonly mostrarRegresar = computed(() => {
    const url = this.url();
    return !(url === '/usuario' || url.startsWith('/usuario/home'));
  });
}
