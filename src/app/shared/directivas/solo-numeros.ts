import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';


@Directive({ selector: 'input[appSoloNumeros]' })
export class SoloNumeros {
  private readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly control = inject(NgControl, { optional: true, self: true });

  
  readonly maxDigitos = input(10);

  @HostListener('input')
  protected alEscribir(): void {
    const input = this.elemento.nativeElement;
    const limpio = input.value.replace(/\D/g, '').slice(0, this.maxDigitos());

    if (limpio === input.value) {
      return;
    }


    input.value = limpio;

    this.control?.control?.setValue(limpio);
  }
}
