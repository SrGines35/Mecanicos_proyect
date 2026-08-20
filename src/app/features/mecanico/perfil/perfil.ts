import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MecanicoService } from '../../../core/services/mecanico.service';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, BarraSuperior],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mecanicoService = inject(MecanicoService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly buscandoUbicacion = signal(false);
  protected readonly avisoUbicacion = signal<string | null>(null);
  protected readonly errorServidor = signal<string | null>(null);

  protected readonly formulario = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(200)]],
    zonaTrabajo: ['', [Validators.required, Validators.minLength(4)]],
    latitud: [0, [Validators.required]],
    longitud: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.mecanicoService.cargarPerfil().subscribe({
      next: (perfil) => {
        if (perfil) {
          this.formulario.patchValue({
            descripcion: perfil.descripcion,
            zonaTrabajo: perfil.zonaTrabajo,
            latitud: perfil.latitud,
            longitud: perfil.longitud,
          });
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected get tieneUbicacion(): boolean {
    const { latitud, longitud } = this.formulario.getRawValue();
    return latitud !== 0 && longitud !== 0;
  }

  protected get coordenadas(): string {
    const { latitud, longitud } = this.formulario.getRawValue();
    return `${latitud.toFixed(5)}, ${longitud.toFixed(5)}`;
  }

  protected get caracteresRestantes(): number {
    return 200 - this.formulario.controls.descripcion.value.length;
  }

  protected mostrarError(campo: 'descripcion' | 'zonaTrabajo'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  /**
   * Toma la ubicacion del GPS del navegador.
   *
   * PENDIENTE: cuando se instale Leaflet, aqui va un mapa para poder
   * arrastrar el pin y ajustar la ubicacion a mano. Por ahora con el
   * GPS es suficiente para poder calcular distancias.
   */
  protected usarMiUbicacion(): void {
    this.avisoUbicacion.set(null);

    if (!('geolocation' in navigator)) {
      this.avisoUbicacion.set('Tu navegador no permite obtener la ubicación.');
      return;
    }

    this.buscandoUbicacion.set(true);

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        this.formulario.patchValue({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
        });
        this.buscandoUbicacion.set(false);
      },
      () => {
        this.buscandoUbicacion.set(false);
        this.avisoUbicacion.set(
          'No pudimos obtener tu ubicación. Revisa que le hayas dado permiso al navegador.'
        );
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  protected guardar(): void {
    this.errorServidor.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (!this.tieneUbicacion) {
      this.avisoUbicacion.set('Falta marcar tu ubicación.');
      return;
    }

    this.guardando.set(true);
    const datos = this.formulario.getRawValue();

    this.mecanicoService
      .guardarPerfil({
        descripcion: datos.descripcion.trim(),
        zonaTrabajo: datos.zonaTrabajo.trim(),
        latitud: datos.latitud,
        longitud: datos.longitud,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          void this.router.navigate(['/mecanico']);
        },
        error: () => {
          this.guardando.set(false);
          this.errorServidor.set('No pudimos guardar tu perfil. Intenta de nuevo.');
        },
      });
  }
}
