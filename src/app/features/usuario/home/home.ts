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
  private readonly sesion = inject(SesionService);

  protected readonly nombreUsuario = computed(
    () => this.sesion.usuario()?.nombre?.trim().split(' ')[0] || 'Usuario'
  );
}
