import { Component, inject, input, signal } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { SesionService } from '../../core/services/sesion.service';

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

  protected readonly confirmando = signal(false);

  protected regresar(): void {
    this.location.back();
  }

  protected pedirConfirmacion(): void {
    this.confirmando.set(true);
  }

  protected cancelarSalida(): void {
    this.confirmando.set(false);
  }

  protected salir(): void {
    this.confirmando.set(false);
    this.auth.cerrarSesion();
    void this.router.navigate(['/']);
  }
}
