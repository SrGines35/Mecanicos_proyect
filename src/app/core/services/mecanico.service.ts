import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, delay, of, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  DatosPerfilMecanico,
  EstadoMecanico,
  PerfilMecanico,
} from '../models/mecanico.model';
import { SesionService } from './sesion.service';

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

  /** Perfil simulado mientras no hay back */
  private perfilSimulado: PerfilMecanico | null = null;

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
    if (!environment.usarApiReal) {
      const actualizado: PerfilMecanico = {
        usuarioId: this.sesion.usuario()?.id ?? 'sim',
        ...datos,
        estado: this.perfilSimulado?.estado ?? 'no_disponible',
        calificacion: this.perfilSimulado?.calificacion ?? 5,
      };
      this.perfilSimulado = actualizado;

      return of(actualizado).pipe(
        delay(this.RETARDO_MS),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http
      .put<PerfilMecanico>(`${this.base}/mi-perfil`, datos)
      .pipe(tap((p) => this.perfil.set(p)));
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
      this.perfilSimulado = { ...this.perfilSimulado, estado };

      return of(this.perfilSimulado).pipe(
        delay(300),
        tap((p) => this.perfil.set(p))
      );
    }

    return this.http
      .patch<PerfilMecanico>(`${this.base}/estado`, { estado })
      .pipe(tap((p) => this.perfil.set(p)));
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
