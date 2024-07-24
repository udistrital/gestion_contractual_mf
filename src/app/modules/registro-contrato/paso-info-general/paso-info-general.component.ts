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
  perfil_contratista: any[] = [];
  fecha_suscripcion: any[] = [];
  aplica_poliza: any[] = [];
  // convenio
  vigencia_convenio: any[] = [];
  convenio: any[] = [];
  nombre_convenio: any[] = [];

  ngOnInit():void{
    this.CargarCompromisos();
    //this.CargarContratos(id_compromiso);
    this.CargarModalidadSeleccion();
    this.CargarRegimenContratacion();
    this.CargarProcedimiento();
    this.CargarUnidadEjecucion();
  }

  //Generales

  CargarCompromisos(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_COMPROMISO_ID + '&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.compromisos = Response.Data;
      }
    })
  }

  CargarModalidadSeleccion(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.MODALIDAD_SELECCION_ID + '&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.modalidad_seleccion = Response.Data;
      }
    })
  }

  CargarRegimenContratacion(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.REGIMEN_CONTRATACION_ID + '&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.regimen_contratacion = Response.Data;
      }
    })
  }

  CargarProcedimiento(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.PROCEDIMIENTO_ID + '&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.procedimiento = Response.Data;
      }
    })
  }

  CargarUnidadEjecucion(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + /*environment.UNIDAD_EJECUCION_ID*/ + '&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.procedimiento = Response.Data;
      }
    })
  }

  //Especificos

  CargarContratos(id_compromiso: undefined){
    this.parametrosService.get('parametro?query=ParametroPadreId:' + id_compromiso + '&TipoParametroId:'+ environment.TIPO_CONTRATO_ID +'&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.contratos = Response.Data;
      }
    })
  }

  CargarTipologiaEspecifica(id_contrato: undefined){
    this.parametrosService.get('parametro?query=ParametroPadreId:' + id_contrato + '&TipoParametroId:'+ environment.TIPOLOGIA_ESPECIFICA_ID +'&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.tipologia_especifica = Response.Data;
      }
    })
  }

  CargarPerfilContratista(id_contrato: undefined){
    if(id_contrato == '6546'){
      this.parametrosService.get('parametro?query=TipoParametroId:' + environment.PERFIL_CONTRATISTA_ID + '&ParametroPadreId:'+ id_contrato +'&limit=0').subscribe((Response: any) => {
        if(Response.Status == "200"){
          this.perfil_contratista = Response.Data;
        }
      })
    }
  }

}