import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-icono-ojo',
  templateUrl: './icono-ojo.html',
})
export class IconoOjo {
  visible = input(false);
  alternar = output<void>();
}
