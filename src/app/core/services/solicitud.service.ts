import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SOLICITUDES_MOCK } from '../data/solicitudes.mock';
import { EstadoSolicitud, Solicitud } from '../models/solicitud.model';

export interface CostosServicio {
  costoPiezas: number;
  costoManoObra: number;
}

/** Porcentaje que cobra la app. Lo confirma el back al guardar. */
const PORCENTAJE_APP = 0.1;

/**
 * Solicitudes de servicio.
 *
 * Endpoints del back:
 *   GET   /solicitudes           las mias, segun mi rol
 *   GET   /solicitudes/:id
 *   PATCH /solicitudes/:id/estado
 *   PATCH /solicitudes/:id/costos
 */
@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/solicitudes`;
  private readonly RETARDO_MS = 600;

  /** Copia editable de los datos de prueba */
  private simuladas: Solicitud[] = SOLICITUDES_MOCK.map((s) => ({ ...s }));

  listar(): Observable<Solicitud[]> {
    if (!environment.usarApiReal) {
      return of(this.simuladas.map((s) => ({ ...s }))).pipe(delay(this.RETARDO_MS));
    }
    return this.http.get<Solicitud[]>(this.base);
  }

  obtener(id: string): Observable<Solicitud> {
    if (!environment.usarApiReal) {
      const encontrada = this.simuladas.find((s) => s.id === id);
      if (!encontrada) {
        return throwError(() => new Error('No encontramos esa solicitud')).pipe(delay(300));
      }
      return of({ ...encontrada }).pipe(delay(300));
    }
    return this.http.get<Solicitud>(`${this.base}/${id}`);
  }

  cambiarEstado(id: string, estado: EstadoSolicitud, mecanicoId?: string): Observable<Solicitud> {
    if (!environment.usarApiReal) {
      return this.actualizarSimulada(id, (s) => ({
        ...s,
        estado,
        mecanicoId: estado === 'aceptada' ? (mecanicoId ?? s.mecanicoId) : s.mecanicoId,
      }));
    }

    return this.http.patch<Solicitud>(`${this.base}/${id}/estado`, { estado });
  }

  guardarCostos(id: string, costos: CostosServicio): Observable<Solicitud> {
    const tarifaApp =
      Math.round((costos.costoPiezas + costos.costoManoObra) * PORCENTAJE_APP * 100) / 100;

    if (!environment.usarApiReal) {
      return this.actualizarSimulada(id, (s) => ({ ...s, ...costos, tarifaApp }));
    }

    return this.http.patch<Solicitud>(`${this.base}/${id}/costos`, costos);
  }

  private actualizarSimulada(
    id: string,
    cambio: (s: Solicitud) => Solicitud
  ): Observable<Solicitud> {
    const indice = this.simuladas.findIndex((s) => s.id === id);

    if (indice === -1) {
      return throwError(() => new Error('No encontramos esa solicitud')).pipe(delay(300));
    }

    this.simuladas[indice] = cambio(this.simuladas[indice]);

    return of(this.simuladas[indice]).pipe(
      delay(400),
      map((s) => ({ ...s }))
    );
  }
}
