import { Component } from '@angular/core';

/**
 * Insignia de la marca: una llave inglesa dibujada en SVG.
 *
 * Antes era el emoji 🔧, que cada sistema operativo pinta de un color
 * distinto (en Windows sale morado) y no combinaba con la paleta.
 * En SVG hereda el color del CSS y siempre se ve igual.
 */
@Component({
  selector: 'app-logo',
  templateUrl: './logo.html',
})
export class Logo {}
