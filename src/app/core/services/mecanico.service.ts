import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, switchMap, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  DatosPerfilMecanico,
  EstadoMecanico,
  PerfilMecanico,
} from '../models/mecanico.model';
import { SesionService } from './sesion.service';

/**
 * Mecanicos de ejemplo, para que la pantalla del cliente no se vea vacia
 * antes de que alguien se registre como mecanico en esta computadora.
 * Estan alrededor de San Pablo Huixtepec.
 */
const MECANICOS_EJEMPLO: PerfilMecanico[] = [
  {
    usuarioId: 'ej-1',
    nombre: 'Juan Ramírez Cruz',
    telefono: '9515551001',
    descripcion: 'Taller propio sobre la carretera. Motor, afinación y diagnóstico.',
    zonaTrabajo: 'Centro de San Pablo Huixtepec',
    latitud: 16.8215,
    longitud: -96.7851,
    estado: 'disponible',
    calificacion: 4.8,
  },
  {
    usuarioId: 'ej-2',
    nombre: 'Lucía Hernández Gómez',
    telefono: '9515552002',
    descripcion: 'Servicio a domicilio. Sistema eléctrico, alternador y marcha.',
    zonaTrabajo: 'San Pablo Huixtepec y Zimatlán',
    latitud: 16.8178,
    longitud: -96.7802,
    estado: 'disponible',
    calificacion: 4.6,
  },
  {
    usuarioId: 'ej-3',
    nombre: 'Rosa Jiménez Santos',
    telefono: '9515554004',
    descripcion: 'Vulcanizadora y auxilio vial. Cambio de llanta a domicilio.',
    zonaTrabajo: 'Agencias cercanas',
    latitud: 16.8302,
    longitud: -96.7889,
    estado: 'disponible',
    calificacion: 4.9,
  },
];

/**
 * Perfil del mecanico que inicio sesion.
 *
 * Endpoints del back:
 *   GET   /mecanicos/mi-perfil
 *   PUT   /mecanicos/mi-perfil
 *   PATCH /mecanicos/estado
 *
 * Mientras environment.usarApiReal sea false, todo vive en memoria.
 */
@Injectable({ providedIn: 'root' })
export class MecanicoService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);

  private readonly base = `${environment.apiUrl}/mecanicos`;
  private readonly RETARDO_MS = 500;

  /** El perfil cargado, o null si todavia no lo llena */
  readonly perfil = signal<PerfilMecanico | null>(null);

  /**
   * Perfiles simulados, guardados en el navegador y separados por usuario.
   *
   * Antes habia un solo perfil en memoria: si registrabas dos mecanicos se
   * pisaban entre ellos, y al recargar la pagina se perdia. Asi no se podia
   * probar con varios mecanicos en distintas ubicaciones.
   */
  private readonly LLAVE_PERFILES = 'oaxicanicos.perfilesSimulados';

  private get perfilSimulado(): PerfilMecanico | null {
    return this.leerPerfiles()[this.idActual()] ?? null;
  }

  private set perfilSimulado(perfil: PerfilMecanico | null) {
    const perfiles = this.leerPerfiles();

    if (perfil) {
      perfiles[this.idActual()] = perfil;
    } else {
      delete perfiles[this.idActual()];
    }

    try {
      localStorage.setItem(this.LLAVE_PERFILES, JSON.stringify(perfiles));
    } catch {
      // Si el navegador no deja guardar, la app sigue funcionando.
    }
  }

  private idActual(): string {
    return this.sesion.usuario()?.id ?? 'sim';
  }

  private leerPerfiles(): Record<string, PerfilMecanico> {
    try {
      const guardado = localStorage.getItem(this.LLAVE_PERFILES);
      return guardado ? (JSON.parse(guardado) as Record<string, PerfilMecanico>) : {};
    } catch {
      return {};
    }
  }

  cargarPerfil(): Observable<PerfilMecanico | null> {
    if (!environment.usarApiReal) {
      return of(this.perfilSimulado).pipe(
        delay(this.RETARDO_MS),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http
      .get<PerfilMecanico | null>(`${this.base}/mi-perfil`)
      .pipe(tap((p) => this.perfil.set(p)));
  }

  guardarPerfil(datos: DatosPerfilMecanico): Observable<PerfilMecanico> {
    const previo = this.perfilSimulado ?? this.perfil();

    /**
     * Al terminar de llenar el perfil por primera vez, el mecanico queda
     * disponible sin tener que ir a prenderlo a mano.
     *
     * Solo pasa la primera vez, cuando el perfil pasa de incompleto a
     * completo. Si despues el mecanico se pone en no_disponible y luego
     * edita su descripcion, se respeta lo que el eligio: seria muy molesto
     * que la app lo volviera a poner disponible sin avisarle.
     */
    const seCompletoAhora =
      !this.perfilCompleto(previo) &&
      this.perfilCompleto({ ...(previo ?? this.perfilVacio()), ...datos });

    if (!environment.usarApiReal) {
      const usuario = this.sesion.usuario();

      const actualizado: PerfilMecanico = {
        usuarioId: this.idActual(),
        nombre: usuario?.nombre,
        telefono: usuario?.telefono,
        ...datos,
        estado: seCompletoAhora ? 'disponible' : previo?.estado ?? 'no_disponible',
        calificacion: previo?.calificacion ?? 5,
      };
      this.perfilSimulado = actualizado;

      return of(actualizado).pipe(
        delay(this.RETARDO_MS),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http.put<PerfilMecanico>(`${this.base}/mi-perfil`, datos).pipe(
      // Son dos llamadas porque el back guarda el perfil y el estado por
      // separado. Si falla la segunda, el perfil ya quedo guardado.
      switchMap((p) => (seCompletoAhora ? this.cambiarEstado('disponible') : of(p))),
      tap((p) => this.perfil.set(p))
    );
  }

  private perfilVacio(): PerfilMecanico {
    return {
      usuarioId: this.idActual(),
      descripcion: '',
      zonaTrabajo: '',
      latitud: 0,
      longitud: 0,
      estado: 'no_disponible',
      calificacion: 5,
    };
  }

  cambiarEstado(estado: EstadoMecanico): Observable<PerfilMecanico> {
    if (!environment.usarApiReal) {
      if (!this.perfilSimulado) {
        this.perfilSimulado = {
          usuarioId: this.sesion.usuario()?.id ?? 'sim',
          descripcion: '',
          latitud: 0,
          longitud: 0,
          zonaTrabajo: '',
          estado,
          calificacion: 5,
        };
      }
      this.perfilSimulado = { ...this.perfilSimulado!, estado };

      return of(this.perfilSimulado!).pipe(
        delay(300),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http
      .patch<PerfilMecanico>(`${this.base}/estado`, { estado })
      .pipe(tap((p) => this.perfil.set(p)));
  }

  /**
   * Los mecanicos que el cliente puede ver: disponibles y con el perfil
   * completo. La pantalla del cliente los ordena por cercania.
   *
   * En modo simulado salen de los perfiles guardados en el navegador, o
   * sea de los mecanicos que de verdad se registraron en esta computadora.
   * Si todavia no hay ninguno, se devuelven los de ejemplo para que la
   * pantalla no se vea vacia.
   */
  listarDisponibles(): Observable<PerfilMecanico[]> {
    if (!environment.usarApiReal) {
      const registrados = Object.values(this.leerPerfiles()).filter(
        (p) => p.estado === 'disponible' && this.perfilCompleto(p)
      );

      const lista = registrados.length > 0 ? registrados : MECANICOS_EJEMPLO;
      return of(lista.map((p) => ({ ...p }))).pipe(delay(this.RETARDO_MS));
    }

    return this.http.get<PerfilMecanico[]>(`${this.base}/disponibles`);
  }

  /**
   * Borra el perfil guardado de un mecanico.
   *
   * Recibe el id en vez de sacarlo de la sesion porque se usa al eliminar
   * la cuenta, cuando la sesion ya se cerro y no habria de donde sacarlo.
   */
  olvidarPerfil(usuarioId: string): void {
    const perfiles = this.leerPerfiles();
    delete perfiles[usuarioId];

    try {
      localStorage.setItem(this.LLAVE_PERFILES, JSON.stringify(perfiles));
    } catch {
      // Si el navegador no deja guardar, no pasa nada grave.
    }

    this.perfil.set(null);
  }

  /**
   * Un perfil sirve solo si tiene descripcion, zona y ubicacion.
   * Sin ubicacion no se puede calcular la distancia, y sin eso el
   * mecanico no puede aparecer en las busquedas.
   */
  perfilCompleto(perfil: PerfilMecanico | null): boolean {
    if (!perfil) {
      return false;
    }
    return (
      perfil.descripcion.trim().length > 0 &&
      perfil.zonaTrabajo.trim().length > 0 &&
      perfil.latitud !== 0 &&
      perfil.longitud !== 0
    );
  }
}
