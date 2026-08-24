import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import {
  EstadoSolicitud,
  PASOS_SERVICIO,
  Solicitud,
  TEXTO_ESTADO_SOLICITUD,
  calcularTotal,
  siguientePaso,
} from '../../../core/models/solicitud.model';
import { MecanicoService } from '../../../core/services/mecanico.service';
import { SesionService } from '../../../core/services/sesion.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { calcularDistanciaKm, formatearDistancia } from '../../../core/utils/distancia.util';
import { SoloNumeros } from '../../../shared/directivas/solo-numeros';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';
import { MapaUbicacion } from '../../../shared/mapa-ubicacion/mapa-ubicacion';

@Component({
  selector: 'app-detalle-solicitud',
  imports: [ReactiveFormsModule, BarraSuperior, SoloNumeros, MapaUbicacion],
  templateUrl: './detalle-solicitud.html',
  styleUrl: './detalle-solicitud.css',
})
export class DetalleSolicitud implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudService);
  private readonly mecanicoService = inject(MecanicoService);
  private readonly sesion = inject(SesionService);

  protected readonly pasos = PASOS_SERVICIO;
  protected readonly textoEstado = TEXTO_ESTADO_SOLICITUD;

  protected readonly solicitud = signal<Solicitud | null>(null);
  protected readonly cargando = signal(true);
  protected readonly procesando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly formularioCostos = this.fb.nonNullable.group({
    costoPiezas: [0, [Validators.required, Validators.min(0)]],
    costoManoObra: [0, [Validators.required, Validators.min(0)]],
  });

  protected readonly distancia = computed(() => {
    const s = this.solicitud();
    const perfil = this.mecanicoService.perfil();

    if (!s || !perfil || perfil.latitud === 0) {
      return null;
    }

    return formatearDistancia(
      calcularDistanciaKm(perfil, { latitud: s.latitudOrigen, longitud: s.longitudOrigen })
    );
  });

  protected readonly enlaceComoLlegar = computed(() => {
    const s = this.solicitud();
    if (!s) {
      return '';
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${s.latitudOrigen},${s.longitudOrigen}`;
  });

  protected readonly esPendiente = computed(() => this.solicitud()?.estado === 'pendiente');

  protected readonly estaActiva = computed(() => {
    const estado = this.solicitud()?.estado;
    return estado === 'aceptada' || estado === 'en_camino' || estado === 'en_proceso';
  });

  protected readonly termino = computed(() => {
    const estado = this.solicitud()?.estado;
    return estado === 'completada' || estado === 'rechazada' || estado === 'cancelada';
  });

  protected readonly total = computed(() => {
    const s = this.solicitud();
    return s ? calcularTotal(s) : 0;
  });

  private readonly valoresCostos = toSignal(this.formularioCostos.valueChanges, {
    initialValue: this.formularioCostos.getRawValue(),
  });

  protected readonly tarifaCalculada = computed(() => {
    const valores = this.valoresCostos();
    const piezas = Number(valores.costoPiezas ?? 0);
    const manoObra = Number(valores.costoManoObra ?? 0);
    return Math.round((piezas + manoObra) * 0.1 * 100) / 100;
  });

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/mecanico']);
      return;
    }

    this.mecanicoService.cargarPerfil().subscribe();

    this.solicitudService.obtener(id).subscribe({
      next: (s) => {
        this.solicitud.set(s);
        this.formularioCostos.patchValue({
          costoPiezas: s.costoPiezas,
          costoManoObra: s.costoManoObra,
        });
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No encontramos esa solicitud');
        this.cargando.set(false);
      },
    });
  }

  protected pasoAlcanzado(paso: EstadoSolicitud): boolean {
    const actual = this.solicitud()?.estado;
    if (!actual) {
      return false;
    }
    const indiceActual = PASOS_SERVICIO.indexOf(actual);
    return indiceActual >= PASOS_SERVICIO.indexOf(paso);
  }

  protected get textoSiguientePaso(): string | null {
    const actual = this.solicitud()?.estado;
    if (!actual) {
      return null;
    }

    const siguiente = siguientePaso(actual);
    if (!siguiente) {
      return null;
    }

    const textos: Partial<Record<EstadoSolicitud, string>> = {
      en_camino: 'Voy en camino',
      en_proceso: 'Ya llegué, empezar reparación',
      completada: 'Terminé el servicio',
    };

    return textos[siguiente] ?? this.textoEstado[siguiente];
  }

  protected aceptar(): void {
    this.cambiarEstado('aceptada');
  }

  protected rechazar(): void {
    this.cambiarEstado('rechazada');
  }

  protected avanzar(): void {
    const actual = this.solicitud()?.estado;
    if (!actual) {
      return;
    }

    const siguiente = siguientePaso(actual);
    if (siguiente) {
      this.cambiarEstado(siguiente);
    }
  }

  protected guardarCostos(): void {
    const s = this.solicitud();
    if (!s || this.formularioCostos.invalid || this.procesando()) {
      return;
    }

    this.procesando.set(true);
    const datos = this.formularioCostos.getRawValue();

    this.solicitudService
      .guardarCostos(s.id, {
        costoPiezas: Number(datos.costoPiezas),
        costoManoObra: Number(datos.costoManoObra),
      })
      .subscribe({
        next: (actualizada) => {
          this.solicitud.set(actualizada);
          this.procesando.set(false);
        },
        error: () => {
          this.procesando.set(false);
          this.error.set('No pudimos guardar los costos');
        },
      });
  }

  protected volver(): void {
    void this.router.navigate(['/mecanico']);
  }

  private cambiarEstado(estado: EstadoSolicitud): void {
    const s = this.solicitud();
    if (!s || this.procesando()) {
      return;
    }

    this.procesando.set(true);

    this.solicitudService.cambiarEstado(s.id, estado, this.sesion.usuario()?.id).subscribe({
      next: (actualizada) => {
        this.solicitud.set(actualizada);
        this.procesando.set(false);

        if (estado === 'rechazada') {
          void this.router.navigate(['/mecanico']);
        }
      },
      error: () => {
        this.procesando.set(false);
        this.error.set('No pudimos actualizar la solicitud');
      },
    });
  }
}
