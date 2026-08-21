import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import * as L from 'leaflet';

/** Lo que emite el mapa cuando el usuario mueve el pin */
export interface Coordenadas {
  latitud: number;
  longitud: number;
}

/**
 * Mapa reutilizable con un pin.
 *
 * Se usa de dos formas:
 *
 * - Solo lectura (editable = false): nada mas muestra donde esta el punto.
 *   Asi se usa en el detalle de la solicitud para ver donde quedo el cliente.
 *
 * - Editable (editable = true): el pin se puede arrastrar y tambien se puede
 *   tocar el mapa para moverlo. Cada vez que se mueve avisa al componente
 *   padre. Asi se usa en el perfil del mecanico.
 *
 * Los mapas son de OpenStreetMap, que es gratis y no pide tarjeta de credito
 * como Google Maps.
 */
@Component({
  selector: 'app-mapa-ubicacion',
  imports: [],
  templateUrl: './mapa-ubicacion.html',
  styleUrl: './mapa-ubicacion.css',
})
export class MapaUbicacion implements OnDestroy {
  readonly latitud = input.required<number>();
  readonly longitud = input.required<number>();

  /** Si es true, el pin se puede arrastrar */
  readonly editable = input(false);

  /** Que tan cerca arranca el mapa. 16 es como media cuadra */
  readonly zoom = input(16);

  /** Texto que sale al tocar el pin */
  readonly etiqueta = input('');

  readonly ubicacionCambiada = output<Coordenadas>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzo');

  private mapa: L.Map | null = null;
  private pin: L.Marker | null = null;

  /**
   * Pin dibujado a mano en SVG.
   *
   * Leaflet trae sus propias imagenes de pin, pero al compilar con Angular
   * las busca en una ruta que no existe y salen rotas. Con un divIcon el
   * dibujo va en el HTML y no depende de ningun archivo.
   */
  private readonly icono = L.divIcon({
    className: 'pin-mapa',
    html: `
      <svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">
        <path fill="#f0951f" stroke="#1a1200" stroke-width="1.1"
          d="M12 2c-3.9 0-7 3.1-7 7 0 5.2 7 13 7 13s7-7.8 7-13c0-3.9-3.1-7-7-7z"/>
        <circle cx="12" cy="9" r="2.6" fill="#1a1200"/>
      </svg>`,
    iconSize: [34, 34],
    iconAnchor: [17, 32],
    popupAnchor: [0, -30],
  });

  constructor() {
    afterNextRender(() => this.crearMapa());

    // Si el padre cambia las coordenadas (por ejemplo al tocar "usar mi
    // ubicacion"), el mapa se mueve solo.
    effect(() => {
      const lat = this.latitud();
      const lng = this.longitud();

      if (!this.mapa || !this.pin) {
        return;
      }

      const actual = this.pin.getLatLng();

      // Sin esta comparacion se haria un ciclo: el pin avisa al padre, el
      // padre cambia el valor, el valor vuelve a mover el pin, y asi.
      if (Math.abs(actual.lat - lat) < 1e-7 && Math.abs(actual.lng - lng) < 1e-7) {
        return;
      }

      this.pin.setLatLng([lat, lng]);
      this.mapa.setView([lat, lng], this.mapa.getZoom());
    });
  }

  ngOnDestroy(): void {
    this.mapa?.remove();
    this.mapa = null;
    this.pin = null;
  }

  private crearMapa(): void {
    const centro: L.LatLngExpression = [this.latitud(), this.longitud()];

    this.mapa = L.map(this.lienzo().nativeElement, {
      center: centro,
      zoom: this.zoom(),
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.mapa);

    this.pin = L.marker(centro, {
      icon: this.icono,
      draggable: this.editable(),
      autoPan: true,
    }).addTo(this.mapa);

    const texto = this.etiqueta();
    if (texto) {
      this.pin.bindPopup(texto);
    }

    if (this.editable()) {
      this.pin.on('dragend', () => this.avisar());
      this.mapa.on('click', (evento: L.LeafletMouseEvent) => {
        this.pin?.setLatLng(evento.latlng);
        this.avisar();
      });
    }

    // El contenedor a veces todavia no tiene su tamaño final cuando Leaflet
    // se dibuja, y el mapa sale cortado o en gris. Esto lo obliga a medirse
    // otra vez ya que la pantalla se acomodo.
    setTimeout(() => this.mapa?.invalidateSize(), 0);
  }

  private avisar(): void {
    const posicion = this.pin?.getLatLng();
    if (!posicion) {
      return;
    }

    this.ubicacionCambiada.emit({
      latitud: posicion.lat,
      longitud: posicion.lng,
    });
  }
}
