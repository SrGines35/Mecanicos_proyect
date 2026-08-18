import { Injectable } from '@angular/core';
import { Observable, delay, of } from 'rxjs';

import { MECANICOS_MOCK } from '../data/mecanicos.mock';
import { Especialidad, Mecanico, MecanicoCercano, Ubicacion } from '../models';
import { calcularDistanciaKm, estimarTiempoLlegadaMin } from '../utils/distancia.util';

export interface FiltroBusqueda {
  /** Si viene, solo devuelve mecanicos con esa especialidad */
  especialidad?: Especialidad;
  /** Radio maximo de busqueda en km. Por defecto 10. */
  radioKm?: number;
  /** Si es true, ignora a los que estan ocupados o desconectados */
  soloDisponibles?: boolean;
}

/**
 * Fuente de datos de mecanicos.
 *
 * Ahorita responde con datos simulados y un delay artificial para que
 * se vea el estado de "cargando". Cuando el back tenga la API, solo hay
 * que cambiar el cuerpo de estos metodos por llamadas con HttpClient;
 * las firmas se quedan igual y las pantallas no se tocan.
 */
@Injectable({ providedIn: 'root' })
export class MecanicoService {
  private readonly RETARDO_SIMULADO_MS = 700;
  private readonly RADIO_POR_DEFECTO_KM = 10;

  /** Todos los mecanicos registrados, sin filtrar. */
  obtenerTodos(): Observable<Mecanico[]> {
    return of(MECANICOS_MOCK).pipe(delay(this.RETARDO_SIMULADO_MS));
  }

  /** Busca un mecanico por su id. Devuelve undefined si no existe. */
  obtenerPorId(id: string): Observable<Mecanico | undefined> {
    const encontrado = MECANICOS_MOCK.find((m) => m.id === id);
    return of(encontrado).pipe(delay(300));
  }

  /**
   * Corazon de la app: dada la ubicacion del cliente, devuelve los
   * mecanicos ordenados del mas cercano al mas lejano.
   */
  buscarCercanos(
    ubicacionCliente: Ubicacion,
    filtro: FiltroBusqueda = {}
  ): Observable<MecanicoCercano[]> {
    const radio = filtro.radioKm ?? this.RADIO_POR_DEFECTO_KM;

    const resultado = MECANICOS_MOCK
      // 1. Filtrar por especialidad si se pidio una
      .filter((mecanico) =>
        filtro.especialidad ? mecanico.especialidades.includes(filtro.especialidad) : true
      )
      // 2. Filtrar por disponibilidad
      .filter((mecanico) => (filtro.soloDisponibles ? mecanico.estado === 'disponible' : true))
      // 3. Calcular distancia y tiempo estimado
      .map((mecanico) => {
        const distanciaKm = calcularDistanciaKm(ubicacionCliente, mecanico.ubicacion);
        const cercano: MecanicoCercano = {
          ...mecanico,
          distanciaKm,
          tiempoEstimadoMin: estimarTiempoLlegadaMin(distanciaKm),
        };
        return cercano;
      })
      // 4. Dejar solo los que caen dentro del radio
      .filter((mecanico) => mecanico.distanciaKm <= radio)
      // 5. Ordenar: primero el mas cerca; a distancia parecida, mejor calificado
      .sort((a, b) => {
        const diferencia = a.distanciaKm - b.distanciaKm;
        if (Math.abs(diferencia) < 0.3) {
          return b.calificacion - a.calificacion;
        }
        return diferencia;
      });

    return of(resultado).pipe(delay(this.RETARDO_SIMULADO_MS));
  }

  /**
   * Devuelve el mejor mecanico disponible para asignacion automatica,
   * que es lo que haria el boton de "buscar mecanico" estilo DiDi.
   */
  asignarAutomatico(
    ubicacionCliente: Ubicacion,
    especialidad?: Especialidad
  ): Observable<MecanicoCercano | null> {
    return new Observable((observer) => {
      this.buscarCercanos(ubicacionCliente, {
        especialidad,
        soloDisponibles: true,
      }).subscribe((lista) => {
        observer.next(lista.length > 0 ? lista[0] : null);
        observer.complete();
      });
    });
  }
}
