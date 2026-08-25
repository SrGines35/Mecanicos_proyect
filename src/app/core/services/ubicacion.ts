import { Injectable } from '@angular/core';

export interface Ubicacion {
  latitud: number;
  longitud: number;
}

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {


  obtenerUbicacion(): Promise<Ubicacion> {

    return new Promise((resolve, reject) => {

      if (!navigator.geolocation) {

        reject(
          new Error(
            'La geolocalización no está disponible en este navegador.'
          )
        );

        return;
      }


      navigator.geolocation.getCurrentPosition(

        (position) => {

          resolve({

            latitud: position.coords.latitude,

            longitud: position.coords.longitude

          });

        },


        (error) => {

          reject(error);

        },

        {
          enableHighAccuracy: true,

          timeout: 10000,

          maximumAge: 0
        }

      );

    });

  }

}