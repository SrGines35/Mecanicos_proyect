import { Component, computed, input } from '@angular/core';

import {
  EstadoSolicitud,
  PASOS_SERVICIO,
  TEXTO_ESTADO_SOLICITUD,
} from '../../core/models/solicitud.model';

@Component({
  selector: 'app-barra-progreso',
  templateUrl: './barra-progreso.html',
  styleUrl: './barra-progreso.css',
})
export class BarraProgreso {
  readonly estado = input.required<EstadoSolicitud>();

  protected readonly pasos = PASOS_SERVICIO;
  protected readonly textoEstado = TEXTO_ESTADO_SOLICITUD;

  protected readonly indiceActual = computed(() => PASOS_SERVICIO.indexOf(this.estado()));

  protected alcanzado(paso: EstadoSolicitud): boolean {
    return this.indiceActual() >= PASOS_SERVICIO.indexOf(paso);
  }
}
