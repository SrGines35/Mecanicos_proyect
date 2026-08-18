import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';

import { EstadoMecanico, MecanicoCercano } from '../../core/models';
import { DistanciaPipe } from '../pipes/distancia.pipe';

const TEXTO_ESTADO: Record<EstadoMecanico, string> = {
  disponible: 'Disponible',
  ocupado: 'Ocupado',
  desconectado: 'Desconectado',
};

/**
 * Tarjeta que resume a un mecanico dentro de una lista.
 * Emite `seleccionar` cuando el usuario la toca.
 */
@Component({
  selector: 'app-tarjeta-mecanico',
  imports: [DecimalPipe, DistanciaPipe],
  templateUrl: './tarjeta-mecanico.html',
  styleUrl: './tarjeta-mecanico.css',
})
export class TarjetaMecanico {
  readonly mecanico = input.required<MecanicoCercano>();

  readonly seleccionar = output<MecanicoCercano>();

  /** Iniciales para el avatar cuando no hay foto, ej. "RC" */
  readonly iniciales = computed(() =>
    this.mecanico()
      .nombre.split(' ')
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0).toUpperCase())
      .join('')
  );

  readonly textoEstado = computed(() => TEXTO_ESTADO[this.mecanico().estado]);

  readonly especialidadesTexto = computed(() => this.mecanico().especialidades.join(' · '));

  alSeleccionar(): void {
    this.seleccionar.emit(this.mecanico());
  }
}
