import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, of, tap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  Credenciales,
  DatosRegistro,
  RespuestaAuth,
  Tokens,
  Usuario,
} from '../models/auth.model';
import { SesionService } from './sesion.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private readonly base = `${environment.apiUrl}/auth`;

  private readonly RETARDO_MS = 700;

  private readonly LLAVE_CUENTAS = 'oaxicanicos.cuentasSimuladas';

  private get cuentasSimuladas(): Map<string, DatosRegistro> {
    try {
      const guardado = localStorage.getItem(this.LLAVE_CUENTAS);
      return new Map(guardado ? (JSON.parse(guardado) as [string, DatosRegistro][]) : []);
    } catch {
      return new Map();
    }
  }

  private guardarCuentas(cuentas: Map<string, DatosRegistro>): void {
    try {
      localStorage.setItem(this.LLAVE_CUENTAS, JSON.stringify([...cuentas]));
    } catch {
    }
  }

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

  actualizarDatos(cambios: { telefono: string }): Observable<Usuario> {
    if (!environment.usarApiReal) {
      const cuentas = this.cuentasSimuladas;
      const correo = this.sesion.usuario()?.correo?.toLowerCase();
      const cuenta = correo ? cuentas.get(correo) : undefined;

      if (cuenta) {
        cuentas.set(correo!, { ...cuenta, telefono: cambios.telefono });
        this.guardarCuentas(cuentas);
      }

      this.sesion.actualizarUsuario(cambios);

      return of(this.sesion.usuario()!).pipe(delay(this.RETARDO_MS));
    }

    return this.http
      .patch<Usuario>(`${this.base}/me`, cambios)
      .pipe(tap((u) => this.sesion.actualizarUsuario(u)));
  }

  eliminarCuenta(): Observable<void> {
    if (!environment.usarApiReal) {
      const cuentas = this.cuentasSimuladas;
      const correo = this.sesion.usuario()?.correo?.toLowerCase();

      if (correo) {
        cuentas.delete(correo);
        this.guardarCuentas(cuentas);
      }

      return of(undefined).pipe(
        delay(this.RETARDO_MS),
        tap(() => this.sesion.limpiar())
      );
    }

    return this.http
      .delete<void>(`${this.base}/me`)
      .pipe(tap(() => this.sesion.limpiar()));
  }

  private registrarSimulado(datos: DatosRegistro): Observable<RespuestaAuth> {
    const correo = datos.correo.toLowerCase();
    const cuentas = this.cuentasSimuladas;

    if (cuentas.has(correo)) {
      return throwError(() => new Error('Ya existe una cuenta con ese correo')).pipe(
        delay(this.RETARDO_MS)
      );
    }

    cuentas.set(correo, { ...datos, correo });
    this.guardarCuentas(cuentas);
    return this.respuestaSimulada(datos, cuentas.size);
  }

  private iniciarSesionSimulado(credenciales: Credenciales): Observable<RespuestaAuth> {
    const cuentas = this.cuentasSimuladas;
    const cuenta = cuentas.get(credenciales.correo.toLowerCase());

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

    return this.respuestaSimulada(cuenta, [...cuentas.keys()].indexOf(cuenta.correo) + 1);
  }

  private respuestaSimulada(datos: DatosRegistro, numero: number): Observable<RespuestaAuth> {
    const respuesta: RespuestaAuth = {
      user: {
        id: `sim-${numero}`,
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
