import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconoOjo } from '../../shared/icono-ojo/icono-ojo';

type Rol = 'usuario' | 'mecanico';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink, IconoOjo],
  templateUrl: './registro.html',
})
export class Registro {
  protected nombre = '';
  protected correo = '';
  protected telefono = '';
  protected contrasena = '';
  protected confirmarContrasena = '';
  protected readonly rol = signal<Rol>('usuario');
  protected readonly enviado = signal(false);
  protected readonly mostrarContrasena = signal(false);

  protected readonly patronNombre = "^[A-Za-zÀ-ÿ' -]{4,14}$";
  protected readonly patronCorreo = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$';
  protected readonly patronContrasena = '^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{6,}$';

  protected get contrasenasCoinciden(): boolean {
    return this.contrasena === this.confirmarContrasena;
  }

  protected onNombreChange(valor: string): void {
    this.nombre = valor.replace(/[0-9]/g, '');
  }

  protected onCorreoChange(valor: string): void {
    this.correo = valor.toLowerCase();
  }

  protected onTelefonoChange(valor: string): void {
    this.telefono = valor.replace(/\D/g, '');
  }

  protected seleccionarRol(valor: Rol): void {
    this.rol.set(valor);
  }

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  protected registrar(): void {
    if (!this.contrasenasCoinciden) return;
    this.enviado.set(true);
  }
}
