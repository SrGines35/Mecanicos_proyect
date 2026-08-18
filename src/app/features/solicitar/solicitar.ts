import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SERVICIOS } from '../../core/data/servicios.catalogo';
import { Especialidad } from '../../core/models';
import { GeolocalizacionService } from '../../core/services/geolocalizacion.service';
import { SolicitudService } from '../../core/services/solicitud.service';
import { Encabezado } from '../../shared/encabezado/encabezado';

/**
 * Formulario donde el usuario describe su problema antes de ver mecanicos.
 */
@Component({
  selector: 'app-solicitar',
  imports: [ReactiveFormsModule, Encabezado],
  templateUrl: './solicitar.html',
  styleUrl: './solicitar.css',
})
export class Solicitar implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private readonly solicitudes = inject(SolicitudService);
  protected readonly geo = inject(GeolocalizacionService);

  protected readonly servicios = SERVICIOS;
  protected readonly intentoEnviar = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    tipoServicio: ['general' as Especialidad, Validators.required],
    vehiculo: ['', [Validators.required, Validators.minLength(3)]],
    descripcionProblema: ['', [Validators.required, Validators.minLength(10)]],
    direccion: ['', Validators.required],
  });

  ngOnInit(): void {
    // Si venimos de la pantalla de inicio, ya trae el tipo elegido
    const tipo = this.ruta.snapshot.queryParamMap.get('tipo') as Especialidad | null;
    if (tipo) {
      this.formulario.controls.tipoServicio.setValue(tipo);
    }

    this.formulario.controls.direccion.setValue(this.geo.ubicacionActual().direccion ?? '');
  }

  /** Dice si un campo esta mal Y el usuario ya lo toco o ya intento enviar */
  protected campoInvalido(nombre: 'vehiculo' | 'descripcionProblema' | 'direccion'): boolean {
    const control = this.formulario.controls[nombre];
    return control.invalid && (control.touched || this.intentoEnviar());
  }

  protected async usarMiUbicacion(): Promise<void> {
    const ubicacion = await this.geo.obtenerUbicacion();
    this.formulario.controls.direccion.setValue(ubicacion.direccion ?? '');
  }

  protected enviar(): void {
    this.intentoEnviar.set(true);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();

    this.solicitudes.guardarBorrador({
      tipoServicio: datos.tipoServicio,
      vehiculo: datos.vehiculo,
      descripcionProblema: datos.descripcionProblema,
      ubicacion: {
        ...this.geo.ubicacionActual(),
        direccion: datos.direccion,
      },
    });

    void this.router.navigate(['/mecanicos'], {
      queryParams: { tipo: datos.tipoServicio },
    });
  }
}
