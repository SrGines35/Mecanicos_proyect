import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { SERVICIOS, ServicioCatalogo } from '../../core/data/servicios.catalogo';
import { GeolocalizacionService } from '../../core/services/geolocalizacion.service';

/**
 * Pantalla principal: el usuario elige que tipo de servicio necesita
 * y de ahi pasa al formulario de solicitud.
 */
@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio implements OnInit {
  private readonly router = inject(Router);
  protected readonly geo = inject(GeolocalizacionService);

  protected readonly servicios = SERVICIOS;
  protected readonly servicioSeleccionado = signal<ServicioCatalogo | null>(null);

  ngOnInit(): void {
    // Se pide la ubicacion apenas entra el usuario, asi cuando llegue
    // a la lista de mecanicos ya la tenemos lista.
    void this.geo.obtenerUbicacion();
  }

  protected seleccionar(servicio: ServicioCatalogo): void {
    const actual = this.servicioSeleccionado();
    // Tocar el mismo servicio otra vez lo deselecciona
    this.servicioSeleccionado.set(actual?.valor === servicio.valor ? null : servicio);
  }

  protected continuar(): void {
    const servicio = this.servicioSeleccionado();
    void this.router.navigate(['/solicitar'], {
      queryParams: servicio ? { tipo: servicio.valor } : {},
    });
  }

  protected verTodos(): void {
    void this.router.navigate(['/mecanicos']);
  }
}
