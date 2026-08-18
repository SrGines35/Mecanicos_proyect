import { Pipe, PipeTransform } from '@angular/core';
import { formatearDistancia } from '../../core/utils/distancia.util';

/**
 * Uso en la plantilla: {{ mecanico.distanciaKm | distancia }}
 * Muestra "850 m" si es menos de 1 km, o "2.4 km" si es mas.
 */
@Pipe({ name: 'distancia', standalone: true })
export class DistanciaPipe implements PipeTransform {
  transform(distanciaKm: number | null | undefined): string {
    if (distanciaKm === null || distanciaKm === undefined) {
      return '-';
    }
    return formatearDistancia(distanciaKm);
  }
}
