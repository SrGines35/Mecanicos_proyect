import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MecanicoCercano } from '../../../core/models/mecanico.model';
import { MecanicoService } from '../../../core/services/mecanico.service';
import { SolicitudService } from '../../../core/services/solicitud.service';
import { calcularDistanciaKm, formatearDistancia } from '../../../core/utils/distancia.util';
import { Coordenadas, MapaUbicacion } from '../../../shared/mapa-ubicacion/mapa-ubicacion';

const OAXACA_LAT = 17.0654;
const OAXACA_LNG = -96.7237;

@Component({
  selector: 'app-solicitar-servicio',
  imports: [ReactiveFormsModule, MapaUbicacion],
  templateUrl: './solicitar-servicio.html',
  styleUrl: './solicitar-servicio.css',
})
export class SolicitarServicio implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly solicitudService = inject(SolicitudService);
  private readonly mecanicoService = inject(MecanicoService);
  private readonly router = inject(Router);

  protected readonly buscandoUbicacion = signal(false);
  protected readonly avisoUbicacion = signal<string | null>(null);
  protected readonly cargandoMecanicos = signal(true);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly latitud = signal(0);
  protected readonly longitud = signal(0);

  private readonly mecanicos = signal<MecanicoCercano[]>([]);

  protected readonly formulario = this.fb.nonNullable.group({
    vehiculo: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(60)]],
    descripcionFalla: [
      '',
      [Validators.required, Validators.minLength(10), Validators.maxLength(300)],
    ],
  });

  protected readonly tieneUbicacion = computed(
    () => this.latitud() !== 0 && this.longitud() !== 0
  );

  protected readonly centroLat = computed(() =>
    this.tieneUbicacion() ? this.latitud() : OAXACA_LAT
  );

  protected readonly centroLng = computed(() =>
    this.tieneUbicacion() ? this.longitud() : OAXACA_LNG
  );

  protected readonly coordenadas = computed(
    () => `${this.latitud().toFixed(5)}, ${this.longitud().toFixed(5)}`
  );

  protected readonly cercanos = computed(() => {
    if (!this.tieneUbicacion()) {
      return [];
    }

    const yo = { latitud: this.latitud(), longitud: this.longitud() };

    return this.mecanicos()
      .map((m) => ({ ...m, distanciaKm: calcularDistanciaKm(yo, m) }))
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  });

  private readonly textoFalla = toSignal(
    this.formulario.controls.descripcionFalla.valueChanges,
    { initialValue: '' }
  );

  protected readonly caracteresRestantes = computed(() => 300 - this.textoFalla().length);

  ngOnInit(): void {
    this.mecanicoService.listarDisponibles().subscribe({
      next: (lista) => {
        this.mecanicos.set(lista.map((m) => ({ ...m, distanciaKm: 0 })));
        this.cargandoMecanicos.set(false);
      },
      error: () => this.cargandoMecanicos.set(false),
    });

    this.usarMiUbicacion();
  }

  protected distancia(km: number): string {
    return formatearDistancia(km);
  }

  protected mostrarError(campo: 'vehiculo' | 'descripcionFalla'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  protected moverPin(coordenadas: Coordenadas): void {
    this.latitud.set(coordenadas.latitud);
    this.longitud.set(coordenadas.longitud);
    this.avisoUbicacion.set(null);
  }

  protected usarMiUbicacion(): void {
    this.avisoUbicacion.set(null);

    if (!('geolocation' in navigator)) {
      this.avisoUbicacion.set('Tu navegador no permite obtener la ubicación.');
      return;
    }

    this.buscandoUbicacion.set(true);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        this.latitud.set(posicion.coords.latitude);
        this.longitud.set(posicion.coords.longitude);
        this.buscandoUbicacion.set(false);
      },
      () => {
        this.buscandoUbicacion.set(false);
        this.avisoUbicacion.set(
          'No pudimos obtener tu ubicación. Márcala tú tocando el mapa donde estás.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  protected enviar(): void {
    this.error.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!this.tieneUbicacion()) {
      this.avisoUbicacion.set('Falta marcar dónde estás.');
      return;
    }

    if (this.enviando()) {
      return;
    }

    this.enviando.set(true);
    const datos = this.formulario.getRawValue();

    this.solicitudService
      .crear({
        vehiculo: datos.vehiculo.trim(),
        descripcionFalla: datos.descripcionFalla.trim(),
        latitudOrigen: this.latitud(),
        longitudOrigen: this.longitud(),
      })
      .subscribe({
        next: () => {
          this.enviando.set(false);

          void this.router.navigate(['/usuario/home']);
        },
        error: () => {
          this.enviando.set(false);
          this.error.set('No pudimos enviar tu solicitud. Intenta de nuevo.');
        },
      });
  }
}
