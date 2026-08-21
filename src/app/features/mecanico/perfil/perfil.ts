import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { MecanicoService } from '../../../core/services/mecanico.service';
import { SesionService } from '../../../core/services/sesion.service';
import { BarraSuperior } from '../../../shared/barra-superior/barra-superior';
import { MenuInferior } from '../../../shared/menu-inferior/menu-inferior';
import { Coordenadas, MapaUbicacion } from '../../../shared/mapa-ubicacion/mapa-ubicacion';

/** Centro de Oaxaca. Solo sirve para que el mapa arranque en algun lado. */
const OAXACA_LAT = 17.0654;
const OAXACA_LNG = -96.7237;

@Component({
  selector: 'app-perfil',
  imports: [ReactiveFormsModule, BarraSuperior, MapaUbicacion, MenuInferior],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly mecanicoService = inject(MecanicoService);
  private readonly auth = inject(AuthService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly buscandoUbicacion = signal(false);
  protected readonly avisoUbicacion = signal<string | null>(null);
  protected readonly errorServidor = signal<string | null>(null);

  /**
   * La ubicacion vive en señales, no en el formulario.
   *
   * Es a proposito: el mapa avisa desde fuera de Angular, y con señales la
   * pantalla se entera sola. Si estuviera en el formulario habria que
   * refrescar la vista a mano cada vez que se arrastra el pin.
   */
  protected readonly latitud = signal(0);
  protected readonly longitud = signal(0);

  protected readonly formulario = this.fb.nonNullable.group({
    descripcion: ['', [Validators.required, Validators.maxLength(200)]],
    zonaTrabajo: ['', [Validators.required, Validators.minLength(4)]],
  });

  protected readonly tieneUbicacion = computed(
    () => this.latitud() !== 0 && this.longitud() !== 0
  );

  /** Donde se para el mapa. Sin ubicacion propia, arranca en el centro de Oaxaca. */
  protected readonly centroLat = computed(() =>
    this.tieneUbicacion() ? this.latitud() : OAXACA_LAT
  );

  protected readonly centroLng = computed(() =>
    this.tieneUbicacion() ? this.longitud() : OAXACA_LNG
  );

  protected readonly coordenadas = computed(
    () => `${this.latitud().toFixed(5)}, ${this.longitud().toFixed(5)}`
  );

  ngOnInit(): void {
    this.mecanicoService.cargarPerfil().subscribe({
      next: (perfil) => {
        if (perfil) {
          this.formulario.patchValue({
            descripcion: perfil.descripcion,
            zonaTrabajo: perfil.zonaTrabajo,
          });
          this.latitud.set(perfil.latitud);
          this.longitud.set(perfil.longitud);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  protected get caracteresRestantes(): number {
    return 200 - this.formulario.controls.descripcion.value.length;
  }

  protected mostrarError(campo: 'descripcion' | 'zonaTrabajo'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  /** Llega desde el mapa cuando se arrastra el pin o se toca el mapa */
  protected moverPin(coordenadas: Coordenadas): void {
    this.latitud.set(coordenadas.latitud);
    this.longitud.set(coordenadas.longitud);
    this.avisoUbicacion.set(null);
  }

  /** Toma la ubicacion del GPS del navegador y mueve el pin ahi */
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
          'No pudimos obtener tu ubicación. Márcala tú en el mapa tocando dónde estás.'
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

    if (!this.tieneUbicacion()) {
      this.avisoUbicacion.set('Falta marcar tu ubicación en el mapa.');
      return;
    }

    this.guardando.set(true);
    const datos = this.formulario.getRawValue();

    this.mecanicoService
      .guardarPerfil({
        descripcion: datos.descripcion.trim(),
        zonaTrabajo: datos.zonaTrabajo.trim(),
        latitud: this.latitud(),
        longitud: this.longitud(),
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

  // -----------------------------------------------------------------
  // Eliminar cuenta
  // -----------------------------------------------------------------

  protected readonly confirmando = signal(false);
  protected readonly eliminando = signal(false);

  protected pedirConfirmacion(): void {
    this.confirmando.set(true);
  }

  protected cancelarEliminar(): void {
    this.confirmando.set(false);
  }

  protected eliminarCuenta(): void {
    if (this.eliminando()) {
      return;
    }

    this.eliminando.set(true);

    // Se guarda antes: al eliminar la cuenta la sesion se cierra y despues
    // ya no habria de donde sacar el id.
    const usuarioId = this.sesion.usuario()?.id;

    this.auth.eliminarCuenta().subscribe({
      next: () => {
        if (usuarioId) {
          this.mecanicoService.olvidarPerfil(usuarioId);
        }
        void this.router.navigate(['/']);
      },
      error: () => {
        this.eliminando.set(false);
        this.confirmando.set(false);
        this.errorServidor.set('No pudimos eliminar la cuenta. Intenta de nuevo.');
      },
    });
  }
}
