import { Location } from '@angular/common';
import { Component, inject, input } from '@angular/core';

/**
 * Barra superior reutilizable: titulo centrado y flecha opcional para regresar.
 */
@Component({
  selector: 'app-encabezado',
  templateUrl: './encabezado.html',
  styleUrl: './encabezado.css',
})
export class Encabezado {
  private readonly location = inject(Location);

  /** Texto que se muestra en la barra */
  readonly titulo = input<string>('');

  /** Si es true, aparece la flecha para regresar */
  readonly mostrarRegresar = input<boolean>(false);

  regresar(): void {
    this.location.back();
  }
}
