import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Logo } from '../../shared/logo/logo';
import { PATRON_CORREO } from '../../core/validadores/validadores';

/**
 * Recuperar contraseña.
 *
 * OJO: el back todavia no tiene este endpoint. Por ahora la pantalla existe
 * y valida el correo, pero no manda ningun correo de verdad.
 *
 * Cuando exista, va a ser:  POST /auth/recuperar  { correo }
 *
 * A proposito el mensaje NO dice si el correo existe o no. Si dijera "ese
 * correo no esta registrado", cualquiera podria ir probando correos para
 * averiguar quien tiene cuenta.
 */
@Component({
  selector: 'app-recuperar',
  imports: [ReactiveFormsModule, RouterLink, Logo],
  templateUrl: './recuperar.html',
  styleUrl: './recuperar.css',
})
export class Recuperar {
  private readonly fb = inject(FormBuilder);

  protected readonly enviando = signal(false);
  protected readonly enviado = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
  });

  protected get correoEscrito(): string {
    return this.formulario.controls.correo.value;
  }

  protected mostrarError(): boolean {
    const control = this.formulario.controls.correo;
    return control.invalid && control.touched;
  }

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    // Simulado mientras el back no tenga el endpoint
    setTimeout(() => {
      this.enviando.set(false);
      this.enviado.set(true);
    }, 700);
  }
}
