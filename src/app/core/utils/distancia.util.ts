const RADIO_TIERRA_KM = 6371;

const gradosARadianes = (grados: number): number => (grados * Math.PI) / 180;

export interface Punto {
  latitud: number;
  longitud: number;
}

/**
 * Formula de Haversine: distancia en linea recta entre dos puntos
 * de la Tierra, en kilometros.
 *
 * Esto lo calcula el FRONT a proposito. Asi el back nada mas devuelve
 * latitud y longitud y no tiene que hacer consultas geograficas.
 */
export function calcularDistanciaKm(origen: Punto, destino: Punto): number {
  const dLat = gradosARadianes(destino.latitud - origen.latitud);
  const dLon = gradosARadianes(destino.longitud - origen.longitud);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(gradosARadianes(origen.latitud)) *
      Math.cos(gradosARadianes(destino.latitud)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return RADIO_TIERRA_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Lo deja bonito para mostrarlo: "850 m" o "2.4 km" */
export function formatearDistancia(distanciaKm: number): string {
  if (distanciaKm < 1) {
    return `${Math.round(distanciaKm * 1000)} m`;
  }
  return `${distanciaKm.toFixed(1)} km`;
}

/** "hace 3 min", "hace 2 h", "hace 4 d" */
export function haceCuanto(fechaIso: string, ahora: number): string {
  const minutos = Math.floor((ahora - new Date(fechaIso).getTime()) / 60000);

  if (minutos < 1) return 'hace un momento';
  if (minutos < 60) return `hace ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;

  return `hace ${Math.floor(horas / 24)} d`;
}
