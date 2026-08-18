import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Reglas de validacion en un solo lugar.
 * Antes estaban repartidas entre login y registro y no coincidian entre si
 * (por ejemplo, el login solo aceptaba correos @gmail.com pero el registro
 * aceptaba cualquiera, asi que quien se registraba con otro correo nunca
 * podia entrar).
 */

/** Correo de cualquier dominio, no solo gmail */
export const PATRON_CORREO = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/** Letras, acentos, espacios, apostrofes y guiones. De 3 a 60 caracteres. */
export const PATRON_NOMBRE = /^[a-zA-ZÀ-ÿñÑ' -]{3,60}$/;

/** Exactamente 10 digitos */
export const PATRON_TELEFONO = /^[0-9]{10}$/;

/** Minimo 8 caracteres, con al menos una letra y un numero */
export const PATRON_CONTRASENA = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;

/**
 * Valida que dos campos de contraseña sean iguales.
 * Se pone sobre el grupo completo, no sobre un campo suelto.
 */
export function contrasenasCoinciden(
  campoContrasena: string,
  campoConfirmar: string
): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const contrasena = grupo.get(campoContrasena)?.value;
    const confirmar = grupo.get(campoConfirmar)?.value;

    // Si todavia no escriben la confirmacion, no molestamos
    if (!confirmar) {
      return null;
    }

    return contrasena === confirmar ? null : { noCoinciden: true };
  };
}

/** Al menos un elemento en un arreglo (para las especialidades del mecanico) */
export function alMenosUno(control: AbstractControl): ValidationErrors | null {
  const valor = control.value;
  return Array.isArray(valor) && valor.length > 0 ? null : { vacio: true };
}

/** Quita espacios al inicio y al final antes de validar el texto */
export function sinEspaciosSobrantes(control: AbstractControl): ValidationErrors | null {
  const valor: string = control.value ?? '';
  return valor.trim().length === 0 && valor.length > 0 ? { soloEspacios: true } : null;
}
