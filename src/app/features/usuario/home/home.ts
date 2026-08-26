import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  EstadoSolicitud,
  MecanicoSolicitud,
  Solicitud,
  TEXTO_ESTADO_SOLICITUD,
  calcularTotal,
} from '../../../core/models/solicitud.model';
import { PerfilMecanico } from '../../../core/models/mecanico.model';
import { MecanicoService } from '../../../core/services/mecanico.service';
import { SesionService } from '../../../core/services/sesion.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { BarraProgreso } from '../../../shared/barra-progreso/barra-progreso';

const MENSAJE_ESTADO: Partial<Record<EstadoSolicitud, string>> = {
  pendiente: 'Estamos buscando un mecánico cerca de ti',
  aceptada: 'Un mecánico aceptó tu solicitud',
  en_camino: 'El mecánico va en camino, la reparación empezará en breve',
  en_proceso: 'Tu vehículo se está reparando',
};

const ESTADOS_VIVOS: EstadoSolicitud[] = [
  'pendiente',
  'aceptada',
  'en_camino',
  'en_proceso',
];

@Component({
  selector: 'app-home',
  imports: [RouterLink, BarraProgreso],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly sesion = inject(SesionService);
  private readonly solicitudes = inject(SolicitudService);
  private readonly mecanicos = inject(MecanicoService);

  protected readonly textoEstado = TEXTO_ESTADO_SOLICITUD;
  protected readonly estrellas = [1, 2, 3, 4, 5];

  protected readonly cargando = signal(true);
  protected readonly activa = signal<Solicitud | null>(null);
  protected readonly porCalificar = signal<Solicitud | null>(null);

  protected readonly mecanico = signal<MecanicoSolicitud | null>(null);
  protected readonly cancelando = signal(false);

  private readonly disponibles = signal<PerfilMecanico[]>([]);
  protected readonly revisando = signal(false);
  protected readonly esperando = signal(false);
  protected readonly insistiendo = signal(false);

  protected readonly seleccion = signal(0);
  protected readonly resaltada = signal(0);
  protected readonly enviando = signal(false);
  protected readonly calificada = signal(false);

  protected readonly nombreUsuario = computed(
    () => this.sesion.usuario()?.nombre?.trim().split(' ')[0] || 'Usuario'
  );

  protected readonly mensajeEstado = computed(() => {
    const solicitud = this.activa();
    return solicitud ? MENSAJE_ESTADO[solicitud.estado] ?? '' : '';
  });

  protected readonly total = computed(() => {
    const solicitud = this.porCalificar();
    return solicitud ? calcularTotal(solicitud) : 0;
  });

  protected readonly pintadas = computed(() => this.resaltada() || this.seleccion());

  protected readonly puedeCancelar = computed(() => this.activa()?.estado === 'pendiente');

  protected readonly sinMecanicos = computed(() => {
    const solicitud = this.activa();

    if (!solicitud || solicitud.estado !== 'pendiente' || this.revisando()) {
      return false;
    }

    const rechazos = solicitud.rechazadaPor ?? [];

    return this.disponibles().filter((m) => !rechazos.includes(m.usuarioId)).length === 0;
  });

  ngOnInit(): void {
    this.solicitudes.listarMias().subscribe({
      next: (lista) => {
        const activa = lista.find((s) => ESTADOS_VIVOS.includes(s.estado)) ?? null;

        this.activa.set(activa);
        this.mecanico.set(activa ? this.datosDelMecanico(activa) : null);

        if (activa) {
          this.buscarMecanicos(activa);
        }

        this.porCalificar.set(
          lista.find(
            (s) => s.estado === 'completada' && (s.calificacion ?? null) === null
          ) ?? null
        );

        this.cargando.set(false);
      },
      error: () => {
        this.activa.set(null);
        this.mecanico.set(null);
        this.porCalificar.set(null);
        this.cargando.set(false);
      },
    });
  }

  private buscarMecanicos(solicitud: Solicitud): void {
    if (solicitud.estado !== 'pendiente') {
      this.disponibles.set([]);
      return;
    }

    this.revisando.set(true);

    this.mecanicos
      .listarDisponibles(solicitud.latitudOrigen, solicitud.longitudOrigen)
      .subscribe({
        next: (lista) => {
          this.disponibles.set(lista);
          this.revisando.set(false);
        },
        error: () => {
          this.disponibles.set([]);
          this.revisando.set(false);
        },
      });
  }

  protected seguirEsperando(): void {
    const solicitud = this.activa();

    if (!solicitud || this.insistiendo()) {
      return;
    }

    this.insistiendo.set(true);

    this.solicitudes.reiniciarRechazos(solicitud.id).subscribe({
      next: (actualizada) => {
        this.activa.set(actualizada);
        this.esperando.set(true);
        this.insistiendo.set(false);
        this.buscarMecanicos(actualizada);
      },
      error: () => this.insistiendo.set(false),
    });
  }

  private datosDelMecanico(solicitud: Solicitud): MecanicoSolicitud | null {
    if (solicitud.mecanico) {
      return solicitud.mecanico;
    }

    if (!solicitud.mecanicoId) {
      return null;
    }

    return this.mecanicos.datosDe(solicitud.mecanicoId);
  }

  protected cancelarSolicitud(): void {
    const solicitud = this.activa();

    if (!solicitud || !this.puedeCancelar() || this.cancelando()) {
      return;
    }

    this.cancelando.set(true);

    this.solicitudes.cancelar(solicitud.id).subscribe({
      next: () => {
        this.activa.set(null);
        this.mecanico.set(null);
        this.disponibles.set([]);
        this.cancelando.set(false);
      },
      error: () => this.cancelando.set(false),
    });
  }

  protected resaltar(valor: number): void {
    this.resaltada.set(valor);
  }

  protected quitarResalte(): void {
    this.resaltada.set(0);
  }

  protected elegir(valor: number): void {
    this.seleccion.set(valor);
  }

  protected confirmar(): void {
    const solicitud = this.porCalificar();
    const valor = this.seleccion();

    if (!solicitud || valor < 1 || this.enviando()) {
      return;
    }

    this.enviando.set(true);

    this.solicitudes.calificar(solicitud.id, valor).subscribe({
      next: () => {
        this.enviando.set(false);
        this.calificada.set(true);
      },
      error: () => this.enviando.set(false),
    });
  }
}
