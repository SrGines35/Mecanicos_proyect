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

/** Lo que llena el cliente para pedir un mecanico */
export interface DatosNuevaSolicitud {
  vehiculo: string;
  descripcionFalla: string;
  latitudOrigen: number;
  longitudOrigen: number;
}

/** Porcentaje que cobra la app. Lo confirma el back al guardar. */
const PORCENTAJE_APP = 0.1;

/**
 * Los estados en los que un servicio ya termino y no vuelve a moverse.
 * Son los que forman el historial del mecanico.
 */
const ESTADOS_CERRADOS: EstadoSolicitud[] = ['completada', 'cancelada', 'rechazada'];

const LLAVE_SOLICITUDES = 'oaxicanicos.solicitudesSimuladas';

/**
 * Solicitudes de servicio.
 *
 * Endpoints del back:
 *   POST  /solicitudes           el cliente pide un mecanico
 *   GET   /solicitudes           las mias, segun mi rol
 *   GET   /solicitudes/:id
 *   PATCH /solicitudes/:id/estado
 *   PATCH /solicitudes/:id/costos
 *
 * En modo simulado las solicitudes se guardan en el navegador. Es a
 * proposito y no es un capricho: asi el cliente crea una solicitud, cierra
 * sesion, entra como mecanico, y LE LLEGA. Sin eso las dos mitades de la
 * app no se pueden probar juntas hasta que el back este listo.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private readonly base = `${environment.apiUrl}/solicitudes`;
  private readonly RETARDO_MS = 600;

  // ---------------------------------------------------------------
  // Guardado en el navegador (solo modo simulado)
  // ---------------------------------------------------------------

  private get simuladas(): Solicitud[] {
    try {
      const guardado = localStorage.getItem(LLAVE_SOLICITUDES);
      if (guardado) {
        return JSON.parse(guardado) as Solicitud[];
      }
    } catch {
      // Si el dato quedo corrupto se empieza de cero
    }

    // La primera vez se siembran las de ejemplo, para que el panel del
    // mecanico no se vea vacio antes de que exista un cliente.
    const iniciales = SOLICITUDES_MOCK.map((s) => ({ ...s }));
    this.guardar(iniciales);
    return iniciales;
  }

  private guardar(lista: Solicitud[]): void {
    try {
      localStorage.setItem(LLAVE_SOLICITUDES, JSON.stringify(lista));
    } catch {
      // Si el navegador no deja guardar, la app sigue funcionando
    }
  }

  // ---------------------------------------------------------------
  // Para el cliente
  // ---------------------------------------------------------------

  /**
   * Crea una solicitud nueva. La usa la pantalla del cliente.
   *
   * El cliente sale de la sesion abierta: no hay que pasarselo.
   */
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

  /** Las solicitudes del cliente que tiene la sesion abierta */
  listarMias(): Observable<Solicitud[]> {
    if (!environment.usarApiReal) {
      const id = this.sesion.usuario()?.id;
      const mias = this.simuladas.filter((s) => s.usuarioId === id);
      return of(mias.map((s) => ({ ...s }))).pipe(delay(this.RETARDO_MS));
    }

    return this.http.get<Solicitud[]>(`${this.base}/mias`);
  }

  /**
   * Si el cliente tiene una solicitud viva ahorita, la devuelve.
   * Sirve para que el home le muestre en que va su servicio.
   */
  miSolicitudActiva(): Observable<Solicitud | null> {
    const vivas: EstadoSolicitud[] = ['pendiente', 'aceptada', 'en_camino', 'en_proceso'];

    return this.listarMias().pipe(
      map((lista) => lista.find((s) => vivas.includes(s.estado)) ?? null)
    );
  }

  /** El cliente se arrepiente antes de que llegue el mecanico */
  cancelar(id: string): Observable<Solicitud> {
    return this.cambiarEstado(id, 'cancelada');
  }

  // ---------------------------------------------------------------
  // Para el mecanico
  // ---------------------------------------------------------------

  listar(): Observable<Solicitud[]> {
    if (!environment.usarApiReal) {
      return of(this.simuladas.map((s) => ({ ...s }))).pipe(delay(this.RETARDO_MS));
    }
    return this.http.get<Solicitud[]>(this.base);
  }

  /**
   * Los servicios que este mecanico ya cerro: terminados, cancelados y
   * rechazados. De la mas reciente a la mas vieja.
   *
   * Se ordena comparando las fechas como texto, no con new Date(). Se
   * puede porque fechaCreacion viene en formato ISO ("2026-08-22T14:03:11Z")
   * y en ese formato el orden alfabetico y el orden cronologico son el
   * mismo: el año va primero, luego el mes, luego el dia. Asi se evita
   * crear un objeto Date por cada comparacion.
   */
  listarHistorial(): Observable<Solicitud[]> {
    if (!environment.usarApiReal) {
      const id = this.sesion.usuario()?.id;

      const mios = this.simuladas
        .filter((s) => s.mecanicoId === id && ESTADOS_CERRADOS.includes(s.estado))
        .sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));

      return of(mios.map((s) => ({ ...s }))).pipe(delay(this.RETARDO_MS));
    }

    return this.http.get<Solicitud[]>(`${this.base}/historial`);
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
