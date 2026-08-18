import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconoOjo } from '../../shared/icono-ojo/icono-ojo';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, IconoOjo],
  templateUrl: './login.html',
})
export class Login {
  protected correo = '';
  protected contrasena = '';
  protected readonly enviado = signal(false);
  protected readonly mostrarContrasena = signal(false);

  protected readonly patronCorreo = '^[a-z0-9._%+-]+@gmail\\.com$';

  protected onCorreoChange(valor: string): void {
    this.correo = valor.toLowerCase();
  }

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  protected iniciarSesion(): void {
    this.enviado.set(true);
  }
}
