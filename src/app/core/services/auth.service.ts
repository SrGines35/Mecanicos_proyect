import { Injectable, computed, signal } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';

import { Credenciales, DatosRegistro, SesionUsuario } from '../models/auth.model';

/**
 * Servicio de autenticacion.
 *
 * Por ahora esta SIMULADO: no hay servidor, solo guarda en memoria y
 * responde con un retardo para que se vea el estado de "cargando".
 *
 * Cuando el back este listo, se cambia el cuerpo de estos metodos por
 * llamadas con HttpClient a:
 *   POST /auth/login
 *   POST /auth/registro/usuario
 *   POST /auth/registro/mecanico
 * Las firmas devuelven Observable a proposito, para no tener que tocar
 * las pantallas cuando eso pase.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly RETARDO_MS = 800;

  /** Sesion activa, o null si nadie ha entrado */
  readonly sesion = signal<SesionUsuario | null>(null);

  readonly estaAutenticado = computed(() => this.sesion() !== null);

  /** Cuentas registradas en esta corrida. Se pierden al recargar. */
  private readonly cuentas = new Map<string, { datos: DatosRegistro; id: string }>();

  iniciarSesion(credenciales: Credenciales): Observable<SesionUsuario> {
    const cuenta = this.cuentas.get(credenciales.correo.toLowerCase());

    // Simulacion: si el correo no esta registrado en esta corrida, se rechaza.
    if (!cuenta) {
      return throwError(
        () => new Error('No encontramos una cuenta con ese correo. Registrate primero.')
      ).pipe(delay(this.RETARDO_MS));
    }

    if (cuenta.datos.contrasena !== credenciales.contrasena) {
      return throwError(() => new Error('La contraseña no es correcta.')).pipe(
        delay(this.RETARDO_MS)
      );
    }

    const sesion = this.construirSesion(cuenta.id, cuenta.datos);
    this.sesion.set(sesion);

    return of(sesion).pipe(delay(this.RETARDO_MS));
  }

  registrar(datos: DatosRegistro): Observable<SesionUsuario> {
    const correo = datos.correo.toLowerCase();

    if (this.cuentas.has(correo)) {
      return throwError(() => new Error('Ese correo ya esta registrado.')).pipe(
        delay(this.RETARDO_MS)
      );
    }

    const id = `${datos.rol}-${this.cuentas.size + 1}`;
    this.cuentas.set(correo, { datos, id });

    const sesion = this.construirSesion(id, datos);
    this.sesion.set(sesion);

    return of(sesion).pipe(delay(this.RETARDO_MS));
  }

  cerrarSesion(): void {
    this.sesion.set(null);
  }

  private construirSesion(id: string, datos: DatosRegistro): SesionUsuario {
    return {
      token: `token-simulado-${id}`,
      id,
      nombre: datos.nombre,
      correo: datos.correo,
      rol: datos.rol,
    };
  }
}
