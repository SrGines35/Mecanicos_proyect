import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { SesionService } from '../../../core/services/sesion.service';
import { PATRON_TELEFONO } from '../../../core/validadores/validadores';
import { SoloNumeros } from '../../../shared/directivas/solo-numeros';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, SoloNumeros],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly sesion = inject(SesionService);

  protected readonly editando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly guardado = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly nombre = computed(() => this.sesion.usuario()?.nombre ?? '');
  protected readonly correo = computed(() => this.sesion.usuario()?.correo ?? '');

  protected readonly formulario = this.fb.nonNullable.group({
    telefono: [
      this.sesion.usuario()?.telefono ?? '',
      [Validators.required, Validators.pattern(PATRON_TELEFONO)],
    ],
  });

  protected mostrarErrorTelefono(): boolean {
    const control = this.formulario.controls.telefono;
    return control.invalid && control.touched;
  }

  protected editar(): void {
    this.guardado.set(false);
    this.error.set(null);
    this.editando.set(true);
  }

  protected cancelar(): void {
    this.formulario.reset({ telefono: this.sesion.usuario()?.telefono ?? '' });
    this.error.set(null);
    this.editando.set(false);
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.auth.actualizarDatos({ telefono: this.formulario.getRawValue().telefono }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.editando.set(false);
        this.guardado.set(true);
        this.formulario.markAsPristine();
      },
      error: () => {
        this.guardando.set(false);
        this.error.set('No pudimos guardar tu teléfono. Intenta de nuevo.');
      },
    });
  }
}
