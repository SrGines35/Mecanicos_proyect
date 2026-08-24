import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, delay, map, of, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { SOLICITUDES_MOCK } from '../data/solicitudes.mock';
import { EstadoSolicitud, Solicitud } from '../models/solicitud.model';
import { SesionService } from './sesion.service';

export interface CostosServicio {
  costoPiezas: number;
  costoManoObra: number;
}

export interface DatosNuevaSolicitud {
  vehiculo: string;
  descripcionFalla: string;
  latitudOrigen: number;
  longitudOrigen: number;
}

const PORCENTAJE_APP = 0.1;

const LLAVE_SOLICITUDES = 'oaxicanicos.solicitudesSimuladas';

@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private readonly base = `${environment.apiUrl}/solicitudes`;
  private readonly RETARDO_MS = 600;

  private get simuladas(): Solicitud[] {
    try {
      const guardado = localStorage.getItem(LLAVE_SOLICITUDES);
      if (guardado) {
        return JSON.parse(guardado) as Solicitud[];
      }
    } catch {
    }

    const iniciales = SOLICITUDES_MOCK.map((s) => ({ ...s }));
    this.guardar(iniciales);
    return iniciales;
  }

  private guardar(lista: Solicitud[]): void {
    try {
      localStorage.setItem(LLAVE_SOLICITUDES, JSON.stringify(lista));
    } catch {
    }
  }

  crear(datos: DatosNuevaSolicitud): Observable<Solicitud> {
    if (!environment.usarApiReal) {
      const usuario = this.sesion.usuario();

      if (!usuario) {
        return throwError(() => new Error('Necesitas iniciar sesión')).pipe(delay(300));
      }

      const nueva: Solicitud = {
        id: `sol-${Date.now()}`,
        usuarioId: usuario.id,
        mecanicoId: null,
        cliente: {
          nombre: usuario.nombre,
          telefono: usuario.telefono ?? '',
        },
        vehiculo: datos.vehiculo.trim(),
        descripcionFalla: datos.descripcionFalla.trim(),
        latitudOrigen: datos.latitudOrigen,
        longitudOrigen: datos.longitudOrigen,
        estado: 'pendiente',
        costoPiezas: 0,
        costoManoObra: 0,
        tarifaApp: 0,
        fechaCreacion: new Date().toISOString(),
      };

      const lista = this.simuladas;
      lista.unshift(nueva);
      this.guardar(lista);

      return of({ ...nueva }).pipe(delay(this.RETARDO_MS));
    }

    return this.http.post<Solicitud>(this.base, datos);
  }

  listarMias(): Observable<Solicitud[]> {
    if (!environment.usarApiReal) {
      const id = this.sesion.usuario()?.id;
      const mias = this.simuladas.filter((s) => s.usuarioId === id);
      return of(mias.map((s) => ({ ...s }))).pipe(delay(this.RETARDO_MS));
    }

    return this.http.get<Solicitud[]>(`${this.base}/mias`);
  }

  miSolicitudActiva(): Observable<Solicitud | null> {
    const vivas: EstadoSolicitud[] = ['pendiente', 'aceptada', 'en_camino', 'en_proceso'];

    return this.listarMias().pipe(
      map((lista) => lista.find((s) => vivas.includes(s.estado)) ?? null)
    );
  }

  cancelar(id: string): Observable<Solicitud> {
    return this.cambiarEstado(id, 'cancelada');
  }

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
    const lista = this.simuladas;
    const indice = lista.findIndex((s) => s.id === id);

    if (indice === -1) {
      return throwError(() => new Error('No encontramos esa solicitud')).pipe(delay(300));
    }

    lista[indice] = cambio(lista[indice]);
    this.guardar(lista);

    return of(lista[indice]).pipe(
      delay(400),
      map((s) => ({ ...s }))
    );
  }
}
