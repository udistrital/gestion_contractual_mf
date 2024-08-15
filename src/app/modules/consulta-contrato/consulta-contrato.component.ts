import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-consulta-contrato',
  templateUrl: './consulta-contrato.component.html',
  styleUrls: ['./consulta-contrato.component.css']
})
export class ConsultaContratoComponent {

  constructor(private _formBuilder: FormBuilder, private parametrosService: ParametrosService) { }

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

  vigencia: any[] = [];
  tipoPersona: any[] = [];

  ngOnInit(): void {
    this.CargarVigencia();
    this.CargarTipoPersona();
  }

  CargarVigencia() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.VIGENCIA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.vigencia = Response.Data;
      }
    })
  }

  CargarTipoPersona() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_PERSONA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tipoPersona = Response.Data;
      }
    })
  }

}