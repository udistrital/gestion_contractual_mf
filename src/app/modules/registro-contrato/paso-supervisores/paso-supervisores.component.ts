import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';


@Component({
  selector: 'app-paso-supervisores',
  templateUrl: './paso-supervisores.component.html',
  styleUrls: ['./paso-supervisores.component.css'],
})

export class PasoSupervisoresComponent {
  thirdFormGroup = this._formBuilder.group({
    dependencia: ['', Validators.required],
    sede: ['', Validators.required],
    supervisor: ['', Validators.required],
    cargo: ['', Validators.required],
    tipoControl: ['', Validators.required],
    codigoVerificacion: ['', Validators.required],
    pais: ['', Validators.required],
    departamento: ['', Validators.required],
    municipioCiudad: ['', Validators.required],
    direccion: ['', Validators.required]
  });

  supervisores: any[] = [{
    dependencia: '',
    sede: '',
    nombre: '',
    cargo: '',
    tipoControl: '',
    codigoVerificacion: ''
  }];

  agregarSupervisor() {
    this.supervisores.push({
      dependencia: '',
      sede: '',
      nombre: '',
      cargo: '',
      tipoControl: '',
      codigoVerificacion: ''
    });
  }

  eliminarSupervisor(index: number) {
    if (this.supervisores.length > 1) {
      this.supervisores.splice(index, 1);
    } else {
      // Opcional: mostrar un mensaje si intentan eliminar el último supervisor
      console.log('No se puede eliminar el último supervisor');
    }
  }

  constructor(private _formBuilder: FormBuilder) { }
}
