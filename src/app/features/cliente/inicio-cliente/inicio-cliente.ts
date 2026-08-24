import { Component, inject } from '@angular/core';

import { SesionService } from '../../../core/services/sesion.service';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';


@Component({
  selector: 'app-inicio-cliente',
  imports: [BarraSuperior],
  templateUrl: './inicio-cliente.html',
})
export class InicioCliente {
  protected readonly sesion = inject(SesionService);
}
