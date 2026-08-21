import { Component, inject } from '@angular/core';

import { SesionService } from '../../../core/services/sesion.service';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';

/**
 * Pantalla de inicio del cliente.
 *
 * OJO: esta pantalla le toca a Luz. Aqui solo queda el esqueleto para
 * que la ruta exista y se pueda probar que el guard manda a cada quien
 * a su lado. El contenido (mapa, lista de mecanicos cercanos, crear
 * solicitud) va en features/cliente/.
 */
@Component({
  selector: 'app-inicio-cliente',
  imports: [BarraSuperior],
  templateUrl: './inicio-cliente.html',
})
export class InicioCliente {
  protected readonly sesion = inject(SesionService);
}
