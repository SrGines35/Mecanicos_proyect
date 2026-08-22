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
import { haceCuanto } from '../../../core/utils/distancia.util';

/**
 * Lo que se le dice al cliente en cada estado, en su idioma.
 *
 * Va tipado con Record<EstadoSolicitud, string> y no con Record<string, string>:
 * asi TypeScript obliga a que las llaves sean EXACTAMENTE los siete estados
 * acordados con el back. Un dedazo como 'en_camnio' ya no pasa desapercibido,
 * y si el equipo agrega un estado nuevo, el compilador avisa que falta aqui.
 */
const MENSAJE_ESTADO: Record<EstadoSolicitud, string> = {
  pendiente: 'Estamos buscando un mecánico cerca de ti.',
  aceptada: 'Un mecánico aceptó tu solicitud y ya la va a atender.',
  en_camino: 'Tu mecánico va en camino.',
  en_proceso: 'Tu mecánico ya llegó y está trabajando.',
  completada: 'El servicio terminó.',
  cancelada: 'Cancelaste este servicio.',
  rechazada: 'Ningún mecánico pudo tomar tu solicitud.',
};

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private readonly sesion = inject(SesionService);
  private readonly solicitudService = inject(SolicitudService);

  protected readonly textoEstado = TEXTO_ESTADO_SOLICITUD;
  protected readonly mensajeEstado = MENSAJE_ESTADO;

  protected readonly cargando = signal(true);
  protected readonly cancelando = signal(false);
  protected readonly activa = signal<Solicitud | null>(null);

  /**
   * Mensaje de error de la consulta, o null si todo salio bien.
   *
   * Antes, si la consulta fallaba solo se apagaba el "cargando" y la pantalla
   * mostraba "no tienes ningun servicio". El cliente veia lo mismo teniendo un
   * servicio en curso que no teniendo ninguno, y no habia forma de distinguir
   * un problema de conexion de una pantalla vacia de verdad.
   */
  protected readonly errorCarga = signal<string | null>(null);

  /** Solo el primer nombre: "Buenas tardes, Ana" se lee mejor */
  protected readonly primerNombre = computed(
    () => this.sesion.usuario()?.nombre?.trim().split(' ')[0] ?? ''
  );

  /** Saludo segun la hora del reloj. No necesita al back. */
  protected readonly saludo = computed(() => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  });

  protected readonly puedeCancelar = computed(() => {
    const estado = this.activa()?.estado;
    return estado === 'pendiente' || estado === 'aceptada';
  });

  protected readonly total = computed(() => {
    const s = this.activa();
    return s ? calcularTotal(s) : 0;
  });

  ngOnInit(): void {
    this.cargar();
  }

  protected cuando(fecha: string): string {
    return haceCuanto(fecha, Date.now());
  }

  protected cancelar(): void {
    const s = this.activa();
    if (!s || this.cancelando()) {
      return;
    }

    this.cancelando.set(true);
    this.solicitudService.cancelar(s.id).subscribe({
      next: () => {
        this.cancelando.set(false);
        this.activa.set(null);
      },
      error: () => this.cancelando.set(false),
    });
  }

  /** Se llama al abrir la pantalla y desde el boton de Reintentar */
  protected cargar(): void {
    this.cargando.set(true);
    this.errorCarga.set(null);

    this.solicitudService.miSolicitudActiva().subscribe({
      next: (s) => {
        this.activa.set(s);
        this.cargando.set(false);
      },
      error: (error: Error) => {
        this.cargando.set(false);
        this.errorCarga.set(
          error?.message || 'No pudimos consultar tu servicio. Revisa tu conexión.'
        );
      },
    });
  }
}
