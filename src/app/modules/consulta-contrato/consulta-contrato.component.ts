import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-consulta-contrato',
  templateUrl: './consulta-contrato.component.html',
  styleUrls: ['./consulta-contrato.component.css']
})
export class ConsultaContratoComponent {

  constructor(private _formBuilder: FormBuilder) { }

  form = this._formBuilder.group({
    unidadEjecutora: [''],
    vigencia: [''],
    tipoContrato: [''],
    tipoPersona: [''],
    numeroElaboracion: [''],
    numeroContrato: [''],
    contratista: [''],
    estado: [''],
    fechaDesde: [''],
    fechaHasta: [''],
  });
  
}