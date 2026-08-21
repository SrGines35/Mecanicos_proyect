import { Injectable, computed, signal } from '@angular/core';

import { Rol, Tokens, Usuario } from '../models/auth.model';

const CLAVE_ACCESS = 'oaxicanicos.accessToken';
const CLAVE_REFRESH = 'oaxicanicos.refreshToken';
const CLAVE_USUARIO = 'oaxicanicos.usuario';

/**
 * Guarda la sesion en el navegador para que el usuario no tenga que
 * volver a iniciar sesion cada vez que abre la app (como Instagram).
 *
 * Se usa localStorage: sobrevive aunque se cierre la pestaña, el
 * navegador o se apague la computadora. Solo se borra al cerrar sesion.
 *
 * Tambien se guarda el usuario porque el endpoint /auth/me del back
 * devuelve nada mas id, correo y role: no manda el nombre. Asi lo
 * tenemos a la mano sin pedirlo otra vez.
 */
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

  /**
   * Cambia datos del usuario guardado sin tocar los tokens.
   * Se usa al editar el telefono desde el perfil.
   */
  actualizarUsuario(cambios: Partial<Usuario>): void {
    const actual = this.usuario();
    if (!actual) {
      return;
    }

    const nuevo = { ...actual, ...cambios };
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(nuevo));
    this.usuario.set(nuevo);
  }

  /** Guarda solo los tokens nuevos, sin tocar el usuario */
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

  /**
   * A donde le toca entrar a esta persona segun su rol.
   *
   * OJO con la diferencia, que se presta a confusion:
   * el ROL que manda el back es 'cliente', pero la RUTA de sus pantallas
   * es /usuario. Se acordo asi con Luz, que es quien las hizo: era mas
   * barato cambiar esta linea que renombrarle cuatro carpetas.
   */
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
      // Si el dato quedo corrupto, mejor empezar de cero
      localStorage.removeItem(CLAVE_USUARIO);
      return null;
    }
  }
}
