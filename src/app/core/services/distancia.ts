import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DistanciaService {


  calcularDistancia(

    latitud1: number,
    longitud1: number,

    latitud2: number,
    longitud2: number

  ): number {


    const radioTierra = 6371;


    const diferenciaLatitud =
      this.toRadians(latitud2 - latitud1);


    const diferenciaLongitud =
      this.toRadians(longitud2 - longitud1);


    const a =

      Math.sin(diferenciaLatitud / 2) ** 2

      +

      Math.cos(this.toRadians(latitud1))

      *

      Math.cos(this.toRadians(latitud2))

      *

      Math.sin(diferenciaLongitud / 2) ** 2;


    const c =
      2 * Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );


    return radioTierra * c;

  }


  private toRadians(grados: number): number {

    return grados * Math.PI / 180;

  }

}