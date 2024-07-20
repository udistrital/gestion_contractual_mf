import { Component } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-paso-info-general',
  templateUrl: './paso-info-general.component.html',
  styleUrls: ['./paso-info-general.component.css'],
})

export class PasoInfoGeneralComponent {

  constructor(private _formBuilder: FormBuilder, private parametrosService: ParametrosService) {}

  firstFormGroup = this._formBuilder.group({
    tipoCompromiso: ['', Validators.required],
    tipoContrato: ['', Validators.required],
    perfilContratista: ['', Validators.required],
    fechaSuscripcion: ['', Validators.required],
    aplicaPoliza: ['', Validators.required],
    modalidadSeleccion: ['', Validators.required],
    tipologiaEspecifica: ['', Validators.required],
    regimenContratacion: ['', Validators.required],
    procedimiento: ['', Validators.required],
    plazoEjecucion: ['', Validators.required],
    unidadEjecucion: ['', Validators.required],
  });

  compromisos: any[] = [];
  contratos: any[] = [];
  modalidad_seleccion: any[] = [];
  tipologia_especifica: any[] = [];
  regimen_contratacion: any[] = [];
  procedimiento: any[] = [];
  plazo_ejecucion: any[] = [];
  unidad_ejecucion: any[] = [];

  // orden-contrato
  perfinl_contratista: any[] = [];
  fecha_suscripcion: any[] = [];
  aplica_poliza: any[] = [];
  // convenio
  vigencia_convenio: any[] = [];
  convenio: any[] = [];
  nombre_convenio: any[] = [];

  ngOnInit():void{
    this.CargarCompromisos();

  }

  CargarCompromisos(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_COMPROMISO_ID + '&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.compromisos = Response.Data;
      }
    })
  }

  CargarContratos(){
    this.parametrosService.get('parametro?query=ParametroPadreId:' + /*id compromiso*/ + '&TipoParametroId:'+ environment.TIPO_CONTRATO_ID +'&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.compromisos = Response.Data;
      }
    })
  }
}