import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { SesionService } from '../../core/services/sesion.service';

@Component({
  selector: 'app-no-encontrada',
  imports: [],
  templateUrl: './no-encontrada.html',
  styleUrl: './no-encontrada.css',
})
export class NoEncontrada {
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  protected readonly textoBoton = computed(() =>
    this.sesion.estaAutenticado() ? 'Volver a mi panel' : 'Ir a iniciar sesión'
  );

  protected volver(): void {
    const usuario = this.sesion.usuario();
    const destino = usuario ? this.sesion.rutaSegunRol(usuario.role) : '/';
    void this.router.navigateByUrl(destino);
  }
}
