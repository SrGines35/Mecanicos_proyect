import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SesionService } from '../../core/services/sesion.service';

/**
 * Pantalla para cuando alguien escribe una direccion que no existe.
 *
 * Antes cualquier direccion mal escrita mandaba al login sin explicar nada,
 * y si ya habias iniciado sesion parecia que te habia sacado la app.
 */
@Component({
  selector: 'app-no-encontrada',
  imports: [],
  templateUrl: './no-encontrada.html',
  styleUrl: './no-encontrada.css',
})
export class NoEncontrada {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  /** Si ya hay sesion lo regresamos a su panel, si no al login */
  protected readonly textoBoton = computed(() =>
    this.sesion.estaAutenticado() ? 'Volver a mi panel' : 'Ir a iniciar sesión'
  );

  protected volver(): void {
    const usuario = this.sesion.usuario();
    const destino = usuario ? this.sesion.rutaSegunRol(usuario.role) : '/';
    void this.router.navigateByUrl(destino);
  }
}
