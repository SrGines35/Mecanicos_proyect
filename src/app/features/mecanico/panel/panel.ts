import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  AYUDA_ESTADO,
  EstadoMecanico,
  TEXTO_ESTADO,
} from '../../../core/models/mecanico.model';
import {
  EstadoSolicitud,
  Solicitud,
  SolicitudCercana,
  TEXTO_ESTADO_SOLICITUD,
} from '../../../core/models/solicitud.model';
import { MecanicoService } from '../../../core/services/mecanico.service';
import { SesionService } from '../../../core/services/sesion.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { calcularDistanciaKm, formatearDistancia, haceCuanto } from '../../../core/utils/distancia.util';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';
import { MenuMecanico } from '../menu-mecanico/menu-mecanico';

const ESTADOS: EstadoMecanico[] = ['disponible', 'ocupado', 'no_disponible'];

const ESTADOS_EN_CURSO: EstadoSolicitud[] = ['aceptada', 'en_camino', 'en_proceso'];

@Component({
  selector: 'app-panel',
  imports: [RouterLink, BarraSuperior, MenuMecanico],
  templateUrl: './panel.html',
  styleUrl: './panel.css',
})
export class Panel implements OnInit {
  private readonly mecanicoService = inject(MecanicoService);
  private readonly solicitudService = inject(SolicitudService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly estados = ESTADOS;
  protected readonly textoEstado = TEXTO_ESTADO;
  protected readonly ayudaEstado = AYUDA_ESTADO;

  protected readonly perfil = this.mecanicoService.perfil;
  protected readonly cargando = signal(true);
  protected readonly cambiandoEstado = signal(false);
  protected readonly textoEstadoSolicitud = TEXTO_ESTADO_SOLICITUD;

  private readonly todas = signal<Solicitud[]>([]);

  protected readonly solicitudes = computed(() =>
    this.conDistancia(this.todas().filter((s) => s.estado === 'pendiente'))
  );

  protected readonly enCurso = computed(() => {
    const mio = this.sesion.usuario()?.id;

    return (
      this.todas().find(
        (s) => s.mecanicoId === mio && ESTADOS_EN_CURSO.includes(s.estado)
      ) ?? null
    );
  });

  protected readonly perfilCompleto = computed(() =>
    this.mecanicoService.perfilCompleto(this.perfil())
  );

  protected readonly estadoActual = computed<EstadoMecanico>(
    () => this.perfil()?.estado ?? 'no_disponible'
  );

  protected readonly primerNombre = computed(
    () => this.sesion.usuario()?.nombre?.trim().split(' ')[0] ?? ''
  );

  protected readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  protected readonly cuantasSolicitudes = computed(() => this.solicitudes().length);

  protected readonly masCercana = computed(() => {
    const primera = this.solicitudes()[0];
    if (!primera || !this.perfilCompleto()) {
      return null;
    }
    return formatearDistancia(primera.distanciaKm);
  });

  protected readonly calificacion = computed(() => this.perfil()?.calificacion ?? null);

  protected readonly zonaTrabajo = computed(() => this.perfil()?.zonaTrabajo ?? '');

  ngOnInit(): void {
    this.mecanicoService.cargarPerfil().subscribe(() => {
      this.cargarSolicitudes();
    });
  }

  protected cambiarEstado(estado: EstadoMecanico): void {
    if (estado === this.estadoActual() || this.cambiandoEstado()) {
      return;
    }

    if (estado === 'disponible' && !this.perfilCompleto()) {
      void this.router.navigate(['/mecanico/perfil']);
      return;
    }

    this.cambiandoEstado.set(true);
    this.mecanicoService.cambiarEstado(estado).subscribe({
      next: () => this.cambiandoEstado.set(false),
      error: () => this.cambiandoEstado.set(false),
    });
  }

  protected abrirSolicitud(id: string): void {
    void this.router.navigate(['/mecanico/solicitud', id]);
  }

  protected distancia(km: number): string {
    return formatearDistancia(km);
  }

  protected cuando(fecha: string): string {
    return haceCuanto(fecha, Date.now());
  }

  private cargarSolicitudes(): void {
    this.cargando.set(true);

    this.solicitudService.listar().subscribe({
      next: (lista) => {
        this.todas.set(lista);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  private conDistancia(lista: Solicitud[]): SolicitudCercana[] {
    const perfil = this.perfil();

    return lista
      .map((s) => ({
        ...s,
        distanciaKm: perfil
          ? calcularDistanciaKm(perfil, {
              latitud: s.latitudOrigen,
              longitud: s.longitudOrigen,
            })
          : 0,
      }))
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }
}
