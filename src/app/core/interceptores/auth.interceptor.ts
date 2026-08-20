import {
  HttpBackend,
  HttpClient,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Tokens } from '../models/auth.model';
import { SesionService } from '../services/sesion.service';

/** Rutas que NO llevan token porque son justo las que lo generan */
const RUTAS_PUBLICAS = /\/auth\/(login|register|refresh)$/;

const conToken = <T>(peticion: HttpRequest<T>, token: string): HttpRequest<T> =>
  peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

/**
 * Se mete en medio de TODAS las llamadas al back y hace dos cosas:
 *
 * 1. Le pega el token a cada peticion que sale.
 * 2. Si el back contesta 401 (token vencido), pide uno nuevo con el
 *    refresh token y REPITE la peticion original. El usuario ni se
 *    entera de que su token se vencio.
 *
 * Esto es lo que hace que la sesion se sienta eterna aunque el
 * accessToken del back dure solo 15 minutos.
 *
 * Nota: la llamada de refresh se hace con HttpBackend a proposito,
 * para que no vuelva a pasar por este mismo interceptor y se cicle.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const httpSinInterceptor = new HttpClient(inject(HttpBackend));

  const esPublica = RUTAS_PUBLICAS.test(peticion.url);
  const token = sesion.accessToken;

  const peticionFinal = !esPublica && token ? conToken(peticion, token) : peticion;

  return siguiente(peticionFinal).pipe(
    catchError((error: HttpErrorResponse) => {
      const refreshToken = sesion.refreshToken;

      // Solo intentamos renovar si el problema es el token vencido
      if (error.status !== 401 || esPublica || !refreshToken) {
        return throwError(() => error);
      }

      return httpSinInterceptor
        .post<Tokens>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
        .pipe(
          switchMap((tokens) => {
            sesion.actualizarTokens(tokens);
            return siguiente(conToken(peticion, tokens.accessToken));
          }),
          catchError((errorRefresh) => {
            // El refresh tambien vencio: hay que volver a iniciar sesion
            sesion.limpiar();
            void router.navigate(['/']);
            return throwError(() => errorRefresh);
          })
        );
    })
  );
};
