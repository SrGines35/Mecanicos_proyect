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
import { SolicitudService } from './solicitud.service';

const ESTADO_HACIA_BACK: Record<EstadoMecanico, string> = {
  disponible: 'disponible',
  ocupado: 'ocupado',
  no_disponible: 'cerrado',
};

@Injectable({ providedIn: 'root' })
export class MecanicoService {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);
  private readonly solicitudes = inject(SolicitudService);

  private readonly base = `${environment.apiUrl}/mechanics`;
  private readonly RETARDO_MS = 500;

  readonly perfil = signal<PerfilMecanico | null>(null);

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

  promedioDe(usuarioId: string): number | null {
    const notas = this.solicitudes.calificacionesDeMecanico(usuarioId);

    if (notas.length === 0) {
      return null;
    }

    const suma = notas.reduce((total, nota) => total + nota, 0);
    return Math.round((suma / notas.length) * 10) / 10;
  }

  private conPromedio(perfil: PerfilMecanico | null): PerfilMecanico | null {
    return perfil ? { ...perfil, calificacion: this.promedioDe(perfil.usuarioId) } : null;
  }

  cargarPerfil(): Observable<PerfilMecanico | null> {
    if (!environment.usarApiReal) {
      return of(this.conPromedio(this.perfilSimulado)).pipe(
        delay(this.RETARDO_MS),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http
      .get<PerfilMecanico | null>(`${this.base}/profile/me`)
      .pipe(tap((p) => this.perfil.set(p)));
  }

  guardarPerfil(datos: DatosPerfilMecanico): Observable<PerfilMecanico> {
    const previo = this.perfilSimulado ?? this.perfil();

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
        calificacion: previo?.calificacion ?? null,
      };
      this.perfilSimulado = actualizado;

      return of(this.conPromedio(actualizado)!).pipe(
        delay(this.RETARDO_MS),
        tap((p) => this.perfil.set(p))
      );
    }

    const peticion = previo
      ? this.http.patch<PerfilMecanico>(`${this.base}/profile/me`, datos)
      : this.http.post<PerfilMecanico>(`${this.base}/profile`, datos);

    return peticion.pipe(

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
      calificacion: null,
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
          calificacion: null,
        };
      }
      this.perfilSimulado = { ...this.perfilSimulado!, estado };

      return of(this.conPromedio(this.perfilSimulado)!).pipe(
        delay(300),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http
      .patch<PerfilMecanico>(`${this.base}/profile/me`, {
        estadoDisponibilidad: ESTADO_HACIA_BACK[estado],
      })
      .pipe(tap((p) => this.perfil.set(p)));
  }

  listarDisponibles(latitud?: number, longitud?: number): Observable<PerfilMecanico[]> {
    if (!environment.usarApiReal) {
      const registrados = Object.values(this.leerPerfiles()).filter(
        (p) => p.estado === 'disponible' && this.perfilCompleto(p)
      );

      return of(registrados.map((p) => ({ ...p, calificacion: this.promedioDe(p.usuarioId) })))
        .pipe(delay(this.RETARDO_MS));
    }

    return this.http.get<PerfilMecanico[]>(`${this.base}/nearby`, {
      params: { lat: latitud ?? 0, lng: longitud ?? 0 },
    });
  }

  olvidarPerfil(usuarioId: string): void {
    const perfiles = this.leerPerfiles();
    delete perfiles[usuarioId];

    try {
      localStorage.setItem(this.LLAVE_PERFILES, JSON.stringify(perfiles));
    } catch {
    }

    this.perfil.set(null);
  }

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
