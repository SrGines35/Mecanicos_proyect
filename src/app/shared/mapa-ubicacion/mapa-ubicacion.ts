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

export interface Coordenadas {
  latitud: number;
  longitud: number;
}

@Component({
  selector: 'app-mapa-ubicacion',
  imports: [],
  templateUrl: './mapa-ubicacion.html',
  styleUrl: './mapa-ubicacion.css',
})
export class MapaUbicacion implements OnDestroy {
  readonly latitud = input.required<number>();
  readonly longitud = input.required<number>();

  readonly editable = input(false);

  readonly zoom = input(16);

  readonly etiqueta = input('');

  readonly ubicacionCambiada = output<Coordenadas>();

  private readonly lienzo = viewChild.required<ElementRef<HTMLDivElement>>('lienzo');

  private mapa: L.Map | null = null;
  private pin: L.Marker | null = null;

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

    effect(() => {
      const lat = this.latitud();
      const lng = this.longitud();

      if (!this.mapa || !this.pin) {
        return;
      }

      const actual = this.pin.getLatLng();

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
