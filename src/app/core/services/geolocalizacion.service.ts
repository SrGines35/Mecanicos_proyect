import { Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Ubicacion } from '../models';

/**
 * Ubicacion de respaldo (Zocalo de Oaxaca).
 * Se usa cuando el navegador niega el permiso o no hay GPS,
 * asi la app nunca se queda sin datos que mostrar.
 */
export const UBICACION_POR_DEFECTO: Ubicacion = {
  latitud: 17.0606,
  longitud: -96.7255,
  direccion: 'Centro de Oaxaca de Juarez (ubicacion aproximada)',
};

@Injectable({ providedIn: 'root' })
export class GeolocalizacionService {
  /** Ultima ubicacion conocida del cliente */
  readonly ubicacionActual = signal<Ubicacion>(UBICACION_POR_DEFECTO);

  /** true mientras se esta pidiendo la ubicacion al navegador */
  readonly cargando = signal(false);

  /** Mensaje de error legible, o null si todo salio bien */
  readonly error = signal<string | null>(null);

  /**
   * Pide la ubicacion real al navegador. Si falla, deja la de respaldo
   * y guarda el motivo en la señal `error`.
   */
  obtenerUbicacion(): Promise<Ubicacion> {
    this.cargando.set(true);
    this.error.set(null);

    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        this.error.set('Tu navegador no soporta geolocalizacion.');
        this.cargando.set(false);
        resolve(UBICACION_POR_DEFECTO);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (posicion) => {
          const ubicacion: Ubicacion = {
            latitud: posicion.coords.latitude,
            longitud: posicion.coords.longitude,
            direccion: 'Tu ubicacion actual',
          };
          this.ubicacionActual.set(ubicacion);
          this.cargando.set(false);
          resolve(ubicacion);
        },
        () => {
          this.error.set(
            'No pudimos obtener tu ubicacion. Usando el centro de Oaxaca como referencia.'
          );
          this.ubicacionActual.set(UBICACION_POR_DEFECTO);
          this.cargando.set(false);
          resolve(UBICACION_POR_DEFECTO);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }

  /** Version observable, por si el resto del equipo prefiere trabajar con RxJS */
  ubicacionActual$(): Observable<Ubicacion> {
    return of(this.ubicacionActual());
  }
}
