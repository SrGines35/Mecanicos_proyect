import { Component, computed, inject, signal } from '@angular/core';

import { SesionService } from '../../../core/services/sesion.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil {
  private readonly sesion = inject(SesionService);

  readonly editando = signal(false);

  readonly nombre = computed(() => this.sesion.usuario()?.nombre ?? '');

  readonly correo = computed(() => this.sesion.usuario()?.correo ?? '');

  readonly telefono = computed(() => this.sesion.usuario()?.telefono ?? '');

  editar(): void {
    this.editando.set(true);
  }

  guardar(): void {
    this.editando.set(false);
  }
}
