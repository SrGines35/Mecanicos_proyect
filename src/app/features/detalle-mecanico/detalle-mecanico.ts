import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { obtenerServicio } from '../../core/data/servicios.catalogo';
import { Mecanico } from '../../core/models';
import { GeolocalizacionService } from '../../core/services/geolocalizacion.service';
import { MecanicoService } from '../../core/services/mecanico.service';
import { SolicitudService } from '../../core/services/solicitud.service';
import { calcularDistanciaKm, estimarTiempoLlegadaMin } from '../../core/utils/distancia.util';
import { Encabezado } from '../../shared/encabezado/encabezado';
import { DistanciaPipe } from '../../shared/pipes/distancia.pipe';

/**
 * Perfil completo de un mecanico y boton para confirmar el servicio.
 */
@Component({
  selector: 'app-detalle-mecanico',
  imports: [Encabezado, DistanciaPipe],
  templateUrl: './detalle-mecanico.html',
  styleUrl: './detalle-mecanico.css',
})
export class DetalleMecanico implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly mecanicoService = inject(MecanicoService);
  private readonly solicitudes = inject(SolicitudService);
  private readonly geo = inject(GeolocalizacionService);

  protected readonly mecanico = signal<Mecanico | null>(null);
  protected readonly cargando = signal(true);
  protected readonly confirmando = signal(false);

  protected readonly borrador = this.solicitudes.borrador;

  protected readonly distanciaKm = computed(() => {
    const m = this.mecanico();
    if (!m) {
      return 0;
    }
    return calcularDistanciaKm(this.geo.ubicacionActual(), m.ubicacion);
  });

  protected readonly tiempoEstimado = computed(() =>
    estimarTiempoLlegadaMin(this.distanciaKm())
  );

  protected readonly nombreServicio = computed(() => {
    const tipo = this.borrador()?.tipoServicio;
    return tipo ? (obtenerServicio(tipo)?.nombre ?? tipo) : null;
  });

  protected readonly iniciales = computed(() =>
    (this.mecanico()?.nombre ?? '')
      .split(' ')
      .slice(0, 2)
      .map((palabra) => palabra.charAt(0).toUpperCase())
      .join('')
  );

  ngOnInit(): void {
    const id = this.ruta.snapshot.paramMap.get('id');

    if (!id) {
      void this.router.navigate(['/mecanicos']);
      return;
    }

    this.mecanicoService.obtenerPorId(id).subscribe((encontrado) => {
      this.mecanico.set(encontrado ?? null);
      this.cargando.set(false);
    });
  }

  protected confirmar(): void {
    const m = this.mecanico();
    if (!m || this.confirmando()) {
      return;
    }

    this.confirmando.set(true);

    this.solicitudes.crear(m.id, m.tarifaBase).subscribe((solicitud) => {
      this.confirmando.set(false);
      void this.router.navigate(['/seguimiento', solicitud.id]);
    });
  }

  protected volverALista(): void {
    void this.router.navigate(['/mecanicos']);
  }
}
