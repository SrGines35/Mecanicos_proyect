import { Injectable, signal } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { EstadoSolicitud, NuevaSolicitud, Solicitud } from '../models';

/**
 * Guarda la solicitud que el usuario esta armando y las que ya creo.
 *
 * Ahorita todo vive en memoria (se pierde al recargar la pagina).
 * Cuando el back este listo:
 *  - crear()  -> POST /solicitudes
 *  - obtener() -> GET /solicitudes/:id
 * Las firmas ya devuelven Observable para que el cambio no rompa nada.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudService {
  /** Lo que el usuario lleno en el formulario, antes de elegir mecanico */
  readonly borrador = signal<NuevaSolicitud | null>(null);

  private readonly solicitudes = signal<Solicitud[]>([]);

  guardarBorrador(datos: NuevaSolicitud): void {
    this.borrador.set(datos);
  }

  limpiarBorrador(): void {
    this.borrador.set(null);
  }

  /** Crea la solicitud formal asignandole un mecanico */
  crear(mecanicoId: string, costoEstimado: number): Observable<Solicitud> {
    const datos = this.borrador();

    const solicitud: Solicitud = {
      id: this.generarId(),
      tipoServicio: datos?.tipoServicio ?? 'general',
      descripcionProblema: datos?.descripcionProblema ?? 'Sin descripcion',
      vehiculo: datos?.vehiculo ?? 'Sin especificar',
      ubicacion: datos?.ubicacion ?? { latitud: 0, longitud: 0 },
      mecanicoId,
      estado: 'aceptada',
      fechaCreacion: new Date(),
      costoEstimado,
    };

    this.solicitudes.update((lista) => [...lista, solicitud]);

    return of(solicitud).pipe(delay(500));
  }

  obtener(id: string): Observable<Solicitud | undefined> {
    return of(this.solicitudes().find((s) => s.id === id)).pipe(delay(200));
  }

  actualizarEstado(id: string, estado: EstadoSolicitud): void {
    this.solicitudes.update((lista) =>
      lista.map((solicitud) => (solicitud.id === id ? { ...solicitud, estado } : solicitud))
    );
  }

  /** Id temporal tipo "sol-4f2a". El back generara el definitivo. */
  private generarId(): string {
    return `sol-${Math.random().toString(16).slice(2, 6)}`;
  }
}
