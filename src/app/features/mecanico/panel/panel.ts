import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  AYUDA_ESTADO,
  EstadoMecanico,
  TEXTO_ESTADO,
} from '../../../core/models/mecanico.model';
import { Solicitud, SolicitudCercana } from '../../../core/models/solicitud.model';
import { MecanicoService } from '../../../core/services/mecanico.service';
import { SesionService } from '../../../core/services/sesion.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { calcularDistanciaKm, formatearDistancia, haceCuanto } from '../../../core/utils/distancia.util';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';
import { MenuInferior } from '../../../shared/menu-inferior/menu-inferior';

const ESTADOS: EstadoMecanico[] = ['disponible', 'ocupado', 'no_disponible'];

@Component({
  selector: 'app-panel',
  imports: [RouterLink, BarraSuperior, MenuInferior],
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
  protected readonly solicitudes = signal<SolicitudCercana[]>([]);

  protected readonly perfilCompleto = computed(() =>
    this.mecanicoService.perfilCompleto(this.perfil())
  );

  protected readonly estadoActual = computed<EstadoMecanico>(
    () => this.perfil()?.estado ?? 'no_disponible'
  );

  /** Solo el primer nombre: "Buenas tardes, Juan" se lee mejor que el nombre completo */
  protected readonly primerNombre = computed(
    () => this.sesion.usuario()?.nombre?.trim().split(' ')[0] ?? ''
  );

  /**
   * Saludo segun la hora del reloj del celular.
   * No necesita al back para nada.
   */
  protected readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  // ---- Numeros del resumen. Todos salen de lo que el front ya tiene ----

  protected readonly cuantasSolicitudes = computed(() => this.solicitudes().length);

  /** La lista viene ordenada por cercania, asi que la primera es la mas cerca */
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

    // Sin perfil completo no tiene caso ponerse disponible: no
    // aparecería en las búsquedas de todos modos.
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
        this.solicitudes.set(this.conDistancia(lista));
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  /**
   * Le agrega la distancia a cada solicitud y las ordena de la mas
   * cercana a la mas lejana. El calculo lo hace el front.
   */
  private conDistancia(lista: Solicitud[]): SolicitudCercana[] {
    const perfil = this.perfil();

    return lista
      .filter((s) => s.estado === 'pendiente')
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
