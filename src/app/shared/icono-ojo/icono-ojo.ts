import { Component, input, output } from '@angular/core';

/** Botoncito para mostrar u ocultar la contraseña */
@Component({
  selector: 'app-icono-ojo',
  templateUrl: './icono-ojo.html',
})
export class IconoOjo {
  readonly visible = input(false);
  readonly alternar = output<void>();
}
