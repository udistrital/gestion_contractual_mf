import { Component } from '@angular/core';
import { FormBuilder, Validators} from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';

@Component({
  selector: 'app-paso-info-general',
  templateUrl: './paso-info-general.component.html',
  styleUrls: ['./paso-info-general.component.css'],
})

export class PasoInfoGeneralComponent {

  constructor(private _formBuilder: FormBuilder, private parametrosService: ParametrosService) { }

  // Paso 1 
  firstFormGroup = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
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
    this.parametrosService.get('parametro?query=TipoParametroId__CodigoAbreviacion:COM&limit=0').subscribe((Response: any) => {
      if(Response.Status == "200"){
        this.compromisos = Response.Data;
      }
    })
  }
}