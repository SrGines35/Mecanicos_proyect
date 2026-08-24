import { Injectable, computed, signal } from '@angular/core';

import { Rol, Tokens, Usuario } from '../models/auth.model';

const CLAVE_ACCESS = 'oaxicanicos.accessToken';
const CLAVE_REFRESH = 'oaxicanicos.refreshToken';
const CLAVE_USUARIO = 'oaxicanicos.usuario';

@Injectable({ providedIn: 'root' })
export class SesionService {
  readonly usuario = signal<Usuario | null>(this.leerUsuario());

  readonly estaAutenticado = computed(() => this.usuario() !== null);
  readonly esMecanico = computed(() => this.usuario()?.role === 'mecanico');

  guardar(usuario: Usuario, tokens: Tokens): void {
    localStorage.setItem(CLAVE_ACCESS, tokens.accessToken);
    localStorage.setItem(CLAVE_REFRESH, tokens.refreshToken);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
    this.usuario.set(usuario);
  }

  actualizarUsuario(cambios: Partial<Usuario>): void {
    const actual = this.usuario();
    if (!actual) {
      return;
    }

    const nuevo = { ...actual, ...cambios };
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(nuevo));
    this.usuario.set(nuevo);
  }

  actualizarTokens(tokens: Tokens): void {
    localStorage.setItem(CLAVE_ACCESS, tokens.accessToken);
    localStorage.setItem(CLAVE_REFRESH, tokens.refreshToken);
  }

  get accessToken(): string | null {
    return localStorage.getItem(CLAVE_ACCESS);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(CLAVE_REFRESH);
  }

  limpiar(): void {
    localStorage.removeItem(CLAVE_ACCESS);
    localStorage.removeItem(CLAVE_REFRESH);
    localStorage.removeItem(CLAVE_USUARIO);
    this.usuario.set(null);
  }

  rutaSegunRol(rol: Rol): string {
    return rol === 'mecanico' ? '/mecanico' : '/usuario';
  }

  private leerUsuario(): Usuario | null {
    const guardado = localStorage.getItem(CLAVE_USUARIO);
    if (!guardado) {
      return null;
    }

    try {
      return JSON.parse(guardado) as Usuario;
    } catch {
      localStorage.removeItem(CLAVE_USUARIO);
      return null;
    }
  }
}
