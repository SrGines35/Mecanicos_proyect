import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ESPECIALIDADES } from '../../core/data/especialidades.catalogo';
import { DatosRegistro, Especialidad, Rol, SesionUsuario } from '../../core/models/auth.model';
import { AuthService } from '../../core/services/auth.service';
import {
  PATRON_CONTRASENA,
  PATRON_CORREO,
  PATRON_NOMBRE,
  PATRON_TELEFONO,
  alMenosUno,
  contrasenasCoinciden,
} from '../../core/validadores/validadores';
import { SoloNumeros } from '../../shared/directivas/solo-numeros';
import { IconoOjo } from '../../shared/icono-ojo/icono-ojo';
import { Logo } from '../../shared/logo/logo';

type CampoRegistro =
  | 'nombre'
  | 'correo'
  | 'telefono'
  | 'contrasena'
  | 'confirmarContrasena'
  | 'especialidades'
  | 'experiencia'
  | 'tarifaBase'
  | 'zonaTrabajo';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, IconoOjo, Logo, SoloNumeros],
  templateUrl: './registro.html',
})
export class Registro {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);

  protected readonly especialidades = ESPECIALIDADES;

  protected readonly mostrarContrasena = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorServidor = signal<string | null>(null);
  protected readonly sesion = signal<SesionUsuario | null>(null);

  protected readonly formulario = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required, Validators.pattern(PATRON_NOMBRE)]],
      correo: ['', [Validators.required, Validators.pattern(PATRON_CORREO)]],
      telefono: ['', [Validators.required, Validators.pattern(PATRON_TELEFONO)]],
      contrasena: ['', [Validators.required, Validators.pattern(PATRON_CONTRASENA)]],
      confirmarContrasena: ['', Validators.required],
      rol: ['usuario' as Rol, Validators.required],

      // Campos que solo aplican al mecanico. Empiezan deshabilitados
      // para que no estorben en la validacion cuando el rol es usuario.
      especialidades: this.fb.nonNullable.control<Especialidad[]>(
        { value: [], disabled: true },
        alMenosUno
      ),
      experiencia: this.fb.nonNullable.control(
        { value: 0, disabled: true },
        [Validators.required, Validators.min(0), Validators.max(60)]
      ),
      tarifaBase: this.fb.nonNullable.control(
        { value: 0, disabled: true },
        [Validators.required, Validators.min(1)]
      ),
      zonaTrabajo: this.fb.nonNullable.control(
        { value: '', disabled: true },
        [Validators.required, Validators.minLength(4)]
      ),
    },
    { validators: contrasenasCoinciden('contrasena', 'confirmarContrasena') }
  );

  protected get esMecanico(): boolean {
    return this.formulario.controls.rol.value === 'mecanico';
  }

  /** Muestra el error de un campo solo si ya se toco */
  protected mostrarError(campo: CampoRegistro): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && control.touched;
  }

  protected get noCoinciden(): boolean {
    const confirmar = this.formulario.controls.confirmarContrasena;
    return this.formulario.hasError('noCoinciden') && confirmar.touched;
  }

  protected seleccionarRol(rol: Rol): void {
    this.formulario.controls.rol.setValue(rol);

    const camposMecanico = [
      this.formulario.controls.especialidades,
      this.formulario.controls.experiencia,
      this.formulario.controls.tarifaBase,
      this.formulario.controls.zonaTrabajo,
    ];

    // Un control deshabilitado no se valida ni se incluye en el valor.
    // Asi el formulario de usuario no exige datos que no le tocan.
    for (const control of camposMecanico) {
      if (rol === 'mecanico') {
        control.enable();
      } else {
        control.disable();
      }
    }
  }

  protected estaMarcada(valor: Especialidad): boolean {
    return this.formulario.getRawValue().especialidades.includes(valor);
  }

  protected alternarEspecialidad(valor: Especialidad): void {
    const control = this.formulario.controls.especialidades;
    const actuales = control.value;

    control.setValue(
      actuales.includes(valor)
        ? actuales.filter((especialidad) => especialidad !== valor)
        : [...actuales, valor]
    );
    control.markAsTouched();
  }

  protected alternarContrasena(): void {
    this.mostrarContrasena.update((valor) => !valor);
  }

  protected registrar(): void {
    this.errorServidor.set(null);

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    // getRawValue() si trae los controles deshabilitados, por eso abajo
    // se arma el objeto segun el rol y no se mandan campos que no aplican.
    const v = this.formulario.getRawValue();
    const base = {
      nombre: v.nombre.trim(),
      correo: v.correo.trim().toLowerCase(),
      telefono: v.telefono,
      contrasena: v.contrasena,
    };

    const datos: DatosRegistro = this.esMecanico
      ? {
          ...base,
          rol: 'mecanico',
          especialidades: v.especialidades,
          experiencia: Number(v.experiencia),
          tarifaBase: Number(v.tarifaBase),
          zonaTrabajo: v.zonaTrabajo.trim(),
        }
      : { ...base, rol: 'usuario' };

    this.auth.registrar(datos).subscribe({
      next: (sesion) => {
        this.enviando.set(false);
        this.sesion.set(sesion);
      },
      error: (error: Error) => {
        this.enviando.set(false);
        this.errorServidor.set(error.message);
      },
    });
  }
}
