import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Solicitud, TEXTO_ESTADO_SOLICITUD } from '../../../core/models/solicitud.model';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';
import { MenuMecanico } from '../menu-mecanico/menu-mecanico';

/** Las tres pestañas de arriba de la lista */
type Filtro = 'todos' | 'completada' | 'cancelada';

@Component({
  selector: 'app-historial',
  imports: [BarraSuperior, MenuMecanico],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class Historial implements OnInit {
  private readonly solicitudService = inject(SolicitudService);
  private readonly router = inject(Router);

  protected readonly textoEstado = TEXTO_ESTADO_SOLICITUD;

  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal<Filtro>('todos');

  private readonly servicios = signal<Solicitud[]>([]);

  /**
   * La lista que se dibuja.
   *
   * El filtro NO vuelve a pedir los datos: la lista completa ya esta en
   * una señal y aqui solo se recorta. Por eso cambiar de pestaña es
   * instantaneo y no depende del back.
   *
   * 'cancelada' junta canceladas y rechazadas: para el mecanico las dos
   * significan lo mismo, que el servicio no se hizo.
   */
  protected readonly visibles = computed(() => {
    const todos = this.servicios();
    const filtro = this.filtro();

    if (filtro === 'todos') {
      return todos;
    }

    if (filtro === 'completada') {
      return todos.filter((s) => s.estado === 'completada');
    }

    return todos.filter((s) => s.estado === 'cancelada' || s.estado === 'rechazada');
  });

  protected readonly cuantosTerminados = computed(
    () => this.servicios().filter((s) => s.estado === 'completada').length
  );

  /**
   * Lo que le quedo al mecanico: piezas mas mano de obra.
   *
   * No se usa calcularTotal() a proposito. Ese incluye la tarifa de la
   * app, que es lo que paga el cliente pero NO lo que recibe el mecanico.
   * Poner ese numero aqui seria decirle que gano mas de lo que gano.
   */
  protected readonly totalGanado = computed(() =>
    this.servicios()
      .filter((s) => s.estado === 'completada')
      .reduce((suma, s) => suma + s.costoPiezas + s.costoManoObra, 0)
  );

  protected readonly hayAlgo = computed(() => this.servicios().length > 0);

  ngOnInit(): void {
    this.solicitudService.listarHistorial().subscribe({
      next: (lista) => {
        this.servicios.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No pudimos cargar tu historial. Intenta de nuevo más tarde.');
        this.cargando.set(false);
      },
    });
  }

  protected cambiarFiltro(filtro: Filtro): void {
    this.filtro.set(filtro);
  }

  protected abrir(id: string): void {
    void this.router.navigate(['/mecanico/solicitud', id]);
  }

  protected ganancia(servicio: Solicitud): number {
    return servicio.costoPiezas + servicio.costoManoObra;
  }

  /** "18 de agosto", sin el año, porque casi siempre es el mismo */
  protected fecha(fechaIso: string): string {
    return new Date(fechaIso).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
    });
  }

  protected dinero(cantidad: number): string {
    return cantidad.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }
}
