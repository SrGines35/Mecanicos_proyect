import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { SERVICIOS, obtenerServicio } from '../../core/data/servicios.catalogo';
import { Especialidad, MecanicoCercano } from '../../core/models';
import { GeolocalizacionService } from '../../core/services/geolocalizacion.service';
import { MecanicoService } from '../../core/services/mecanico.service';
import { Encabezado } from '../../shared/encabezado/encabezado';
import { TarjetaMecanico } from '../../shared/tarjeta-mecanico/tarjeta-mecanico';

/**
 * Lista de mecanicos ordenada del mas cercano al mas lejano.
 * Es el corazon del flujo tipo DiDi.
 */
@Component({
  selector: 'app-mecanicos-cercanos',
  imports: [Encabezado, TarjetaMecanico],
  templateUrl: './mecanicos-cercanos.html',
  styleUrl: './mecanicos-cercanos.css',
})
export class MecanicosCercanos implements OnInit {
  private readonly mecanicoService = inject(MecanicoService);
  private readonly geo = inject(GeolocalizacionService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  protected readonly servicios = SERVICIOS;

  protected readonly mecanicos = signal<MecanicoCercano[]>([]);
  protected readonly cargando = signal(true);
  protected readonly filtroEspecialidad = signal<Especialidad | null>(null);
  protected readonly soloDisponibles = signal(true);
  protected readonly radioKm = signal(10);

  protected readonly textoFiltro = computed(() => {
    const filtro = this.filtroEspecialidad();
    if (!filtro) {
      return 'Todos los servicios';
    }
    return obtenerServicio(filtro)?.nombre ?? filtro;
  });

  ngOnInit(): void {
    const tipo = this.ruta.snapshot.queryParamMap.get('tipo') as Especialidad | null;
    this.filtroEspecialidad.set(tipo);
    this.buscar();
  }

  protected buscar(): void {
    this.cargando.set(true);

    this.mecanicoService
      .buscarCercanos(this.geo.ubicacionActual(), {
        especialidad: this.filtroEspecialidad() ?? undefined,
        soloDisponibles: this.soloDisponibles(),
        radioKm: this.radioKm(),
      })
      .subscribe((lista) => {
        this.mecanicos.set(lista);
        this.cargando.set(false);
      });
  }

  protected cambiarFiltro(valor: Especialidad | null): void {
    this.filtroEspecialidad.set(this.filtroEspecialidad() === valor ? null : valor);
    this.buscar();
  }

  protected alternarDisponibles(): void {
    this.soloDisponibles.set(!this.soloDisponibles());
    this.buscar();
  }

  protected ampliarRadio(): void {
    this.radioKm.set(this.radioKm() + 10);
    this.buscar();
  }

  protected abrirDetalle(mecanico: MecanicoCercano): void {
    void this.router.navigate(['/mecanicos', mecanico.id]);
  }

  /** Boton estilo DiDi: te manda directo al mejor mecanico de la lista */
  protected asignarAutomatico(): void {
    const primero = this.mecanicos()[0];
    if (primero) {
      this.abrirDetalle(primero);
    }
  }
}
