import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Credenciales, DatosRegistro, RespuestaAuth, Tokens } from '../models/auth.model';
import { SesionService } from './sesion.service';

/**
 * Servicio de autenticacion.
 *
 * Habla con el back real cuando `environment.usarApiReal` es true.
 * Mientras esta en false, responde con datos simulados en memoria
 * para que el front se pueda seguir desarrollando y probando aunque
 * el servidor no este levantado.
 *
 * Endpoints del back (repo App_Mecanicos, rama Dropxni):
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/refresh
 *   GET  /auth/me
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private readonly base = `${environment.apiUrl}/auth`;

  /** Cuentas de prueba mientras no hay back. Se pierden al recargar. */
  private readonly cuentasSimuladas = new Map<string, DatosRegistro>();
  private readonly RETARDO_MS = 700;

  registrar(datos: DatosRegistro): Observable<RespuestaAuth> {
    if (!environment.usarApiReal) {
      return this.registrarSimulado(datos);
    }

    return this.http
      .post<RespuestaAuth>(`${this.base}/register`, datos)
      .pipe(tap((r) => this.sesion.guardar(r.user, r.tokens)));
  }

  iniciarSesion(credenciales: Credenciales): Observable<RespuestaAuth> {
    if (!environment.usarApiReal) {
      return this.iniciarSesionSimulado(credenciales);
    }

    return this.http
      .post<RespuestaAuth>(`${this.base}/login`, credenciales)
      .pipe(tap((r) => this.sesion.guardar(r.user, r.tokens)));
  }

  cerrarSesion(): void {
    this.sesion.limpiar();
  }

  // ---------------------------------------------------------------
  // Modo simulado
  // ---------------------------------------------------------------

  private registrarSimulado(datos: DatosRegistro): Observable<RespuestaAuth> {
    const correo = datos.correo.toLowerCase();

    if (this.cuentasSimuladas.has(correo)) {
      return throwError(() => new Error('Ya existe una cuenta con ese correo')).pipe(
        delay(this.RETARDO_MS)
      );
    }

    this.cuentasSimuladas.set(correo, datos);
    return this.respuestaSimulada(datos);
  }

  private iniciarSesionSimulado(credenciales: Credenciales): Observable<RespuestaAuth> {
    const cuenta = this.cuentasSimuladas.get(credenciales.correo.toLowerCase());

    if (!cuenta) {
      return throwError(
        () => new Error('No encontramos una cuenta con ese correo. Registrate primero.')
      ).pipe(delay(this.RETARDO_MS));
    }

    if (cuenta.password !== credenciales.password) {
      return throwError(() => new Error('La contraseña no es correcta')).pipe(
        delay(this.RETARDO_MS)
      );
    }

    return this.respuestaSimulada(cuenta);
  }

  private respuestaSimulada(datos: DatosRegistro): Observable<RespuestaAuth> {
    const respuesta: RespuestaAuth = {
      user: {
        id: `sim-${this.cuentasSimuladas.size}`,
        nombre: datos.nombre,
        correo: datos.correo,
        telefono: datos.telefono,
        role: datos.role,
      },
      tokens: {
        accessToken: 'token-simulado',
        refreshToken: 'refresh-simulado',
      },
    };

    return of(respuesta).pipe(
      delay(this.RETARDO_MS),
      tap((r) => this.sesion.guardar(r.user, r.tokens))
    );
  }
}
