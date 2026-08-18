import { Ubicacion } from '../models';

const RADIO_TIERRA_KM = 6371;

const gradosARadianes = (grados: number): number => (grados * Math.PI) / 180;

/**
 * Formula de Haversine: calcula la distancia en linea recta entre dos
 * puntos de la Tierra, en kilometros.
 *
 * No es la distancia real manejando (para eso haria falta una API de rutas),
 * pero sirve perfecto para ordenar mecanicos del mas cercano al mas lejano.
 */
export function calcularDistanciaKm(origen: Ubicacion, destino: Ubicacion): number {
  const dLat = gradosARadianes(destino.latitud - origen.latitud);
  const dLon = gradosARadianes(destino.longitud - origen.longitud);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(origen.latitud)) *
      Math.cos(gradosARadianes(destino.latitud)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return RADIO_TIERRA_KM * c;
}

/**
 * Estimacion simple del tiempo de llegada.
 * Se asume una velocidad promedio de 25 km/h (trafico de ciudad) y se
 * suman 5 minutos fijos de preparacion del mecanico.
 */
export function estimarTiempoLlegadaMin(distanciaKm: number): number {
  const VELOCIDAD_PROMEDIO_KMH = 25;
  const MINUTOS_PREPARACION = 5;

  const minutosViaje = (distanciaKm / VELOCIDAD_PROMEDIO_KMH) * 60;

  return Math.max(1, Math.round(minutosViaje + MINUTOS_PREPARACION));
}

/** Redondea a un decimal para mostrarlo en pantalla, ej. 2.4 km */
export function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }
  return `${distanciaKm.toFixed(1)} km`;
}
