import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  EstadoSolicitud,
  Solicitud,
  TEXTO_ESTADO_SOLICITUD,
  calcularTotal,
} from '../../../core/models/solicitud.model';
import { SesionService } from '../../../core/services/sesion.service';
import { SolicitudService } from '../../../core/services/solicitud.service';

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
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly sesion = inject(SesionService);
  private readonly solicitudes = inject(SolicitudService);

  protected readonly textoEstado = TEXTO_ESTADO_SOLICITUD;
  protected readonly estrellas = [1, 2, 3, 4, 5];

  protected readonly cargando = signal(true);
  protected readonly activa = signal<Solicitud | null>(null);
  protected readonly porCalificar = signal<Solicitud | null>(null);

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

  ngOnInit(): void {
    this.solicitudes.listarMias().subscribe({
      next: (lista) => {
        this.activa.set(lista.find((s) => ESTADOS_VIVOS.includes(s.estado)) ?? null);

        this.porCalificar.set(
          lista.find(
            (s) => s.estado === 'completada' && (s.calificacion ?? null) === null
          ) ?? null
        );

        this.cargando.set(false);
      },
      error: () => {
        this.activa.set(null);
        this.porCalificar.set(null);
        this.cargando.set(false);
      },
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
