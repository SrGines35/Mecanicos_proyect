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

const RUTAS_PUBLICAS = /\/auth\/(login|register|refresh)$/;

const conToken = <T>(peticion: HttpRequest<T>, token: string): HttpRequest<T> =>
  peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

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
            sesion.limpiar();
            void router.navigate(['/']);
            return throwError(() => errorRefresh);
          })
        );
    })
  );
};
