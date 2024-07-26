import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-paso-info-general',
  templateUrl: './paso-info-general.component.html',
  styleUrls: ['./paso-info-general.component.css'],
})

export class PasoInfoGeneralComponent implements OnInit {
  showContratoFields = false;
  showConvenioFields = false;

  constructor(private _formBuilder: FormBuilder, private parametrosService: ParametrosService, private cdRef: ChangeDetectorRef) { }

  firstFormGroup = this._formBuilder.group({
    tipoCompromiso: ['', Validators.required],
    tipoContrato: ['', Validators.required],
    perfilContratista: [''],
    fechaSuscripcion: [''],
    aplicaPoliza: [''],
    vigenciaConvenio: [''],
    convenio: [''],
    nombreConvenio: [''],
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
  aplica_poliza: { value: string; viewValue: string }[] = [
    { value: '0', viewValue: 'No' },
    { value: '1', viewValue: 'Si' },
  ];
  // convenio
  vigencia_convenio: any[] = [];
  convenio: any[] = [];
  nombre_convenio: any[] = [];

  ngOnInit(): void {
    this.CargarCompromisos();
    this.CargarModalidadSeleccion();
    this.CargarRegimenContratacion();
    this.CargarProcedimiento();
    this.CargarUnidadEjecucion();

    this.firstFormGroup.get('tipoCompromiso')?.valueChanges.subscribe((id_compromiso) => {
      if (id_compromiso) {
        this.CargarContratos(id_compromiso);
        this.showFieldsBasedOnCompromiso(id_compromiso);
      }
    });

    this.firstFormGroup.get('tipoContrato')?.valueChanges.subscribe((id_contrato) => {
      if (id_contrato) {
        console.log('Tipo de contrato cambiado a:', id_contrato);
        console.log('CONTRATO_PERFIL_CONTRATISTA_ID:', environment.CONTRATO_PERFIL_CONTRATISTA_ID);

        this.CargarTipologiaEspecifica(id_contrato);

        const idContratoStr = id_contrato.toString();
        const perfilContratistaIdStr = environment.CONTRATO_PERFIL_CONTRATISTA_ID.toString();

        console.log('¿Son iguales?', id_contrato === environment.CONTRATO_PERFIL_CONTRATISTA_ID);

        const perfilContratistaControl = this.firstFormGroup.get('perfilContratista');
        if (idContratoStr === perfilContratistaIdStr) {
          console.log('Activando perfil contratista');
          this.CargarPerfilContratista(id_contrato);
          perfilContratistaControl?.setValidators(Validators.required);
          perfilContratistaControl?.enable();
        } else {
          console.log('Desactivando perfil contratista');
          perfilContratistaControl?.clearValidators();
          perfilContratistaControl?.disable();
        }
        perfilContratistaControl?.updateValueAndValidity();

        console.log('Estado de perfilContratista:', perfilContratistaControl?.enabled);

        this.cdRef.detectChanges();
      }
    });

  }

  //Generales

  CargarCompromisos() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_COMPROMISO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.compromisos = Response.Data;
      }
    })
  }

  CargarModalidadSeleccion() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.MODALIDAD_SELECCION_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.modalidad_seleccion = Response.Data;
      }
    })
  }

  CargarRegimenContratacion() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.REGIMEN_CONTRATACION_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.regimen_contratacion = Response.Data;
      }
    })
  }

  CargarProcedimiento() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.PROCEDIMIENTO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.procedimiento = Response.Data;
      }
    })
  }

  CargarUnidadEjecucion() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.UNIDAD_EJECUCION_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.unidad_ejecucion = Response.Data;
      }
    })
  }

  //Especificos

  showFieldsBasedOnCompromiso(id_compromiso: string) {
    console.log('Tipo de compromiso seleccionado:', id_compromiso);

    const idCompromisoStr = id_compromiso.toString();

    this.showContratoFields = idCompromisoStr === environment.CONTRATO_ID || idCompromisoStr === environment.ORDEN_ID;
    this.showConvenioFields = idCompromisoStr === environment.CONVENIO_ID;

    console.log('showContratoFields:', this.showContratoFields);
    console.log('showConvenioFields:', this.showConvenioFields);

    const contratoFields = ['fechaSuscripcion', 'aplicaPoliza'];
    const convenioFields = ['vigenciaConvenio', 'convenio', 'nombreConvenio'];

    [...contratoFields, ...convenioFields, 'perfilContratista'].forEach(field => {
      const control = this.firstFormGroup.get(field);
      if (control) {
        control.reset();
        if ((this.showContratoFields && contratoFields.includes(field)) ||
          (this.showConvenioFields && convenioFields.includes(field))) {
          control.setValidators(Validators.required);
          control.enable();
        } else {
          control.clearValidators();
          control.disable();
        }
        control.updateValueAndValidity();
      }
    });

    // Si es un contrato, habilitar la selección de tipo de contrato
    if (this.showContratoFields) {
      this.firstFormGroup.get('tipoContrato')?.enable();
    } else {
      this.firstFormGroup.get('tipoContrato')?.disable();
    }

    this.cdRef.detectChanges();
  }

  CargarContratos(id_compromiso: string) {
    this.parametrosService.get('parametro?query=ParametroPadreId:' + id_compromiso + '&TipoParametroId:' + environment.TIPO_CONTRATO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.contratos = Response.Data;
      }
    })
  }

  CargarTipologiaEspecifica(id_contrato: string) {
    this.parametrosService.get('parametro?query=ParametroPadreId:' + id_contrato + '&TipoParametroId:' + environment.TIPOLOGIA_ESPECIFICA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tipologia_especifica = Response.Data;
      }
    })
  }

  CargarPerfilContratista(id_contrato: string) {
    console.log('Cargando perfil contratista para id_contrato:', id_contrato);
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.PERFIL_CONTRATISTA_ID + '&ParametroPadreId:' + id_contrato + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.perfil_contratista = Response.Data;
        console.log('Perfiles de contratista cargados:', this.perfil_contratista);
      }
    });
  }

}