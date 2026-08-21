import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { SesionService } from '../../core/services/sesion.service';

/**
 * Barra de arriba de las pantallas internas.
 * Muestra el titulo, la flecha para regresar y el boton de salir.
 */
@Component({
  selector: 'app-barra-superior',
  templateUrl: './barra-superior.html',
  styleUrl: './barra-superior.css',
})
export class BarraSuperior {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly sesion = inject(SesionService);

  readonly titulo = input<string>('');
  readonly mostrarRegresar = input<boolean>(false);

  protected regresar(): void {
    this.location.back();
  }

  protected salir(): void {
    this.auth.cerrarSesion();
    void this.router.navigate(['/']);
  }
}
