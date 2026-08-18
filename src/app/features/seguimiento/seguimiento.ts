import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { EstadoSolicitud, Mecanico, Solicitud } from '../../core/models';
import { MecanicoService } from '../../core/services/mecanico.service';
import { SolicitudService } from '../../core/services/solicitud.service';
import { Encabezado } from '../../shared/encabezado/encabezado';

interface PasoSeguimiento {
  estado: EstadoSolicitud;
  titulo: string;
  detalle: string;
}

/** Los pasos por los que pasa un servicio, en orden. */
const PASOS: PasoSeguimiento[] = [
  {
    estado: 'aceptada',
    titulo: 'Solicitud aceptada',
    detalle: 'El mecanico ya vio tu solicitud y viene para alla.',
  },
  {
    estado: 'en-camino',
    titulo: 'En camino',
    detalle: 'Va manejando hacia tu ubicacion.',
  },
  {
    estado: 'atendiendo',
    titulo: 'Atendiendo tu vehiculo',
    detalle: 'Ya llego y esta revisando el problema.',
  },
  {
    estado: 'finalizada',
    titulo: 'Servicio terminado',
    detalle: 'Listo. No olvides calificar al mecanico.',
  },
];

/**
 * Pantalla de seguimiento del servicio.
 *
 * OJO: el avance entre pasos esta SIMULADO con un temporizador para poder
 * enseñar la pantalla. Cuando el back tenga WebSocket o polling, hay que
 * reemplazar `simularAvance()` por la suscripcion real.
 */
@Component({
  selector: 'app-seguimiento',
  imports: [Encabezado],
  templateUrl: './seguimiento.html',
  styleUrl: './seguimiento.css',
})
export class Seguimiento implements OnInit, OnDestroy {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly solicitudes = inject(SolicitudService);
  private readonly mecanicoService = inject(MecanicoService);

  private temporizador?: ReturnType<typeof setInterval>;

  protected readonly pasos = PASOS;
  protected readonly solicitud = signal<Solicitud | null>(null);
  protected readonly mecanico = signal<Mecanico | null>(null);
  protected readonly indicePaso = signal(0);

  protected readonly pasoActual = computed(() => PASOS[this.indicePaso()]);
  protected readonly terminado = computed(() => this.indicePaso() >= PASOS.length - 1);

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/']);
      return;
    }

    this.solicitudes.obtener(id).subscribe((encontrada) => {
      if (!encontrada) {
        // Si recargaron la pagina se pierde la solicitud (vive en memoria),
        // asi que regresamos al inicio en vez de dejar la pantalla vacia.
        void this.router.navigate(['/']);
        return;
      }

      this.solicitud.set(encontrada);

      if (encontrada.mecanicoId) {
        this.mecanicoService.obtenerPorId(encontrada.mecanicoId).subscribe((m) => {
          this.mecanico.set(m ?? null);
        });
      }

      this.simularAvance();
    });
  }

  ngOnDestroy(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
    }
  }

  /** TEMPORAL: avanza un paso cada 4 segundos para demostrar el flujo. */
  private simularAvance(): void {
    this.temporizador = setInterval(() => {
      if (this.indicePaso() >= PASOS.length - 1) {
        clearInterval(this.temporizador);
        return;
      }

      this.indicePaso.update((i) => i + 1);

      const solicitud = this.solicitud();
      if (solicitud) {
        this.solicitudes.actualizarEstado(solicitud.id, this.pasoActual().estado);
      }
    }, 4000);
  }

  protected volverAlInicio(): void {
    this.solicitudes.limpiarBorrador();
    void this.router.navigate(['/']);
  }
}
