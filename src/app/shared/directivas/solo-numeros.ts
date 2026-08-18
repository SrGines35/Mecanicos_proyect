import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Deja que en un input SOLO se puedan escribir numeros.
 *
 * Por que hace falta: filtrar el texto en el metodo del componente limpia
 * el valor guardado, pero NO borra lo que ya se ve escrito en la pantalla.
 * Por eso antes se quedaban las letras visibles en el campo de telefono
 * aunque por dentro el valor estuviera vacio.
 *
 * Esta directiva corrige las dos cosas a la vez: el input que se ve y el
 * valor del formulario. Tambien funciona al pegar texto con el mouse.
 */
@Directive({ selector: 'input[appSoloNumeros]' })
export class SoloNumeros {
  private readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly control = inject(NgControl, { optional: true, self: true });

  /** Cuantos digitos se permiten como maximo */
  readonly maxDigitos = input(10);

  @HostListener('input')
  protected alEscribir(): void {
    const input = this.elemento.nativeElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, this.maxDigitos());

    if (limpio === input.value) {
      return;
    }

    // 1. Arregla lo que se ve
    input.value = limpio;
    // 2. Arregla el valor del formulario
    this.control?.control?.setValue(limpio);
  }
}
