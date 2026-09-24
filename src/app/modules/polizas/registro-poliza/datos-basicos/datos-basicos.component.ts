import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PolizasService } from '../../../services/polizas.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-datos-basicos',
  templateUrl: './datos-basicos.component.html',
  styleUrls: ['./datos-basicos.component.css'],
  standalone: false,
})
export class DatosBasicosComponent implements OnInit {
  polizaForm: FormGroup = this.createForm();

  entidadesAseguradoras: any[] = [
    { name: 'Seguros del Estado', id: 1 },
    { name: 'Seguros Bolívar', id: 2 },
    { name: 'La Previsora Seguros', id: 3 },
    { name: 'Aseguradora Solidaria de Colombia', id: 4 },
  ];

  constructor(
    private fb: FormBuilder,
    private polizasService: PolizasService
  ) {}

  ngOnInit(): void {}

  private createForm(): FormGroup {
    return this.fb.group({
      numero_poliza: ['', Validators.required],
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null, Validators.required],
      fecha_expedicion: [null, Validators.required],
      fecha_aprobacion: [null, Validators.required],
      entidad_aseguradora_id: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.polizaForm.valid) {
      this.polizasService.postPoliza(this.polizaForm.value).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'success',
            title: 'Éxito',
            text: 'Póliza guardada exitosamente',
          });
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              'Error al guardar la póliza: ' +
              (error.message || 'Error del servidor'),
          });
        },
      });
    }
  }
}
