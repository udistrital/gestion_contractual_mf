import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-guardar-info',
  standalone: true,
  templateUrl: './guardar-info.component.html',
  styleUrls: ['./guardar-info.component.css'],
  imports: [
    CommonModule,
    MatButtonModule
  ]
})
export class GuardarInfoComponent {
  mostrarModal() {
    Swal.fire({
      html: `
      <h3 style="margin-bottom: 5px;">SE REGISTRÓ EXITOSAMENTE EL CONTRATO</h3>
      <p style="margin: 5px 0;">CONSECUTIVO DE ELABORACIÓN: ###</p>
      <p style="margin: 5px 0;">VIGENCIA 2024</p>
    `,
      icon: "success",
      confirmButtonText: 'OK',
      confirmButtonColor: 'rgb(100, 21, 21)',
    });
  }
}