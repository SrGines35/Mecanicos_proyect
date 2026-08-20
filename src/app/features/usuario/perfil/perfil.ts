import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil {

  editando = false;

  usuario = {
    nombre: 'Usuario',
    correo: 'correo@ejemplo.com',
    telefono: '9510000000',
    vehiculo: 'Nissan Versa 2018 blanco'
  };


  editar(): void {
    this.editando = true;
  }


  guardar(): void {
    this.editando = false;
  }

}