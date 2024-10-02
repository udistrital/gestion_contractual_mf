import {ChangeDetectorRef, Component, EventEmitter, OnChanges, OnInit, Output, ViewChild} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';
import {ContratoGeneralCrudService} from "../../../services/contrato-general-crud.service";
import {ApiResponse} from "../../../services/polizas.interfaces";

interface Parametro {
  Id: number;
  Nombre: string;
  Descripcion: string;
  CodigoAbreviacion: string;
  Activo: boolean;
}

@Component({
  selector: 'app-paso-info-general',
  templateUrl: './paso-info-general.component.html',
  styleUrls: ['./paso-info-general.component.css'],
})
export class PasoInfoGeneralComponent implements OnInit, OnChanges {
  @Output() nextStep = new EventEmitter<void>();

  showContratoFields = false;
  showConvenioFields = false;
  isLoading = false;
  loadedData: boolean = false;
  maxDate: Date = new Date();
  formId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private parametrosService: ParametrosService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private cdRef: ChangeDetectorRef
  ) {
  }

  form = this.fb.group({
    tipoCompromisoId: ['', Validators.required],
    tipoContratoId: ['', Validators.required],
    perfilContratista: [''],
    fechaSuscripcion: [''],
    aplicaPoliza: [''],
    vigenciaConvenio: [''],
    convenio: [''],
    nombreConvenio: [''],
    modalidadSeleccionId: ['', Validators.required],
    tipologiaEspecificaId: ['', Validators.required],
    regimenContratacionId: ['', Validators.required],
    procedimientoId: ['', Validators.required],
    plazoEjecucion: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    unidadEjecutoraId: ['', Validators.required],
  });

  //Parametros (Opciones)
  tipoCompromisos: Parametro[] = [];
  tipoContratos: Parametro[] = [];
  modalidadSeleccion: Parametro[] = [];
  tipologiaEspecifica: Parametro[] = [];
  regimenContratacion: Parametro[] = [];
  procedimientoId: Parametro[] = [];
  unidadEjecucion: Parametro[] = [];

  // orden-contrato
  perfilContratista: Parametro[] = [];
  aplicaPoliza: { value: string; viewValue: string }[] = [
    {value: '0', viewValue: 'No'},
    {value: '1', viewValue: 'Si'},
  ];

  // convenio
  vigenciaConvenio: Parametro[] = [];
  convenio: Parametro[] = [];

   ngOnChanges() {
      console.log('Step 1 changeddd');
   }

  ngOnInit(): void {
    this.loadInitialData();
    this.setuptipoCompromisoId();
    this.setuptipoContratoId();
  }

  private setuptipoCompromisoId() {
    this.form.get('tipoCompromisoId')?.valueChanges.subscribe((id_compromiso) => {
      if (id_compromiso) {
        this.CargartipoContratoIds(id_compromiso);
        this.showFieldsBasedOnCompromiso(id_compromiso);
        if (id_compromiso) {
          this.CargartipologiaEspecificaId(id_compromiso);

          const idCompromisoStr = id_compromiso.toString();
          const perfilCompromisoIdStr = environment.ORDEN_ID.toString();

          const perfilCompromisoControl = this.form.get('aplicaPoliza');
          if (idCompromisoStr === perfilCompromisoIdStr) {
            perfilCompromisoControl?.setValidators(Validators.required);
            perfilCompromisoControl?.enable();
          } else {
            perfilCompromisoControl?.clearValidators();
            perfilCompromisoControl?.disable();
          }
          perfilCompromisoControl?.updateValueAndValidity();

          this.cdRef.detectChanges();
        }
      }
    });
  }

  private setuptipoContratoId() {
    this.form.get('tipoContratoId')?.valueChanges.subscribe((id_contrato) => {
      if (id_contrato) {
        this.CargartipologiaEspecificaId(id_contrato);

        const idContratoStr = id_contrato.toString();
        const tipoContratoIdIdStr = environment.CONTRATO_PSPAG_ID.toString();

        const perfilContratistaControl = this.form.get('perfilContratista');
        const fechaSuscripcionControl = this.form.get('fechaSuscripcion');

        if (idContratoStr === tipoContratoIdIdStr) {
          this.CargarPerfilContratista(id_contrato);
          perfilContratistaControl?.setValidators(Validators.required);
          perfilContratistaControl?.enable();

          fechaSuscripcionControl?.setValidators(Validators.required);
          fechaSuscripcionControl?.enable();
        } else {
          perfilContratistaControl?.clearValidators();
          perfilContratistaControl?.disable();

          fechaSuscripcionControl?.clearValidators();
          fechaSuscripcionControl?.disable();
        }
        perfilContratistaControl?.updateValueAndValidity();

        this.cdRef.detectChanges();
      }
    });
  }

  private loadSavedData(): void {
    console.log('Loading saved data...');
    try{
      this.isLoading = true;
      const savedForm = localStorage.getItem('contrato-general');
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        this.form.patchValue(parsedForm);
        this.formId = parsedForm.id || null;
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      localStorage.removeItem('contrato-general');
    }
    this.isLoading = false;
  }

  private loadInitialData(): void {
    console.log('Loading initial data...');
    this.isLoading = true;
    Promise.all([
      this.CargarCompromisos(),
      this.CargarmodalidadSeleccionId(),
      this.CargarregimenContratacionId(),
      this.CargarprocedimientoId(),
      this.CargarunidadEjecutoraId()
    ]).then(() => {
      this.isLoading = false;
      this.loadedData = true;
      this.cdRef.detectChanges();
    }).catch(this.handleError);
  }

  //Generales

  CargarCompromisos() {
    return new Promise((resolve, reject) => {
      this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_COMPROMISO_ID + '&limit=0').subscribe({
        next: (Response: any) => {
          if (Response.Status == "200") {
            this.tipoCompromisos = Response.Data;
            resolve(true);
          } else {
            reject('Error en la respuesta del servidor');
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  async showErrorAlert(message: string) {
    await Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: message,
    });
  }

  CargarmodalidadSeleccionId() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.MODALIDAD_SELECCION_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.modalidadSeleccion = Response.Data;
      }
    })
  }

  CargarregimenContratacionId() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.REGIMEN_CONTRATACION_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.regimenContratacion = Response.Data;
      }
    })
  }

  CargarprocedimientoId() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.procedimientoId_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.procedimientoId = Response.Data;
      }
    })
  }

  CargarunidadEjecutoraId() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.UNIDAD_EJECUCION_ID + ',Id__in:166|180|181&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.unidadEjecucion = Response.Data;
      }
    })
  }

  //Especificos

  showFieldsBasedOnCompromiso(id_compromiso: string) {
    const idCompromisoStr = id_compromiso.toString();

    this.showContratoFields = idCompromisoStr === environment.CONTRATO_ID || idCompromisoStr === environment.ORDEN_ID;
    this.showConvenioFields = idCompromisoStr === environment.CONVENIO_ID;

    const convenioFields = ['vigenciaConvenio', 'convenio', 'nombreConvenio'];

    [...convenioFields, 'perfilContratista', 'aplicaPoliza', 'fechaSuscripcion'].forEach(field => {
      const control = this.form.get(field);
      if (control) {
        control.reset();
        if ((this.showConvenioFields && convenioFields.includes(field))) {
          control.setValidators(Validators.required);
          control.enable();
        } else {
          control.clearValidators();
          control.disable();
        }
        control.updateValueAndValidity();
      }
    });

    this.cdRef.detectChanges();
  }

  CargartipoContratoIds(id_compromiso: string) {
    this.parametrosService.get('parametro?query=ParametroPadreId:' + id_compromiso + '&TipoParametroId:' + environment.TIPO_CONTRATO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tipoContratos = Response.Data;
      }
    })
  }

  CargartipologiaEspecificaId(id_contrato: string) {
    this.parametrosService.get('parametro?query=ParametroPadreId:' + id_contrato + '&TipoParametroId:' + environment.TIPOLOGIA_ESPECIFICA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tipologiaEspecifica = Response.Data;
      }
    })
  }

  CargarPerfilContratista(id_contrato: string) {
    if (id_contrato == environment.CONTRATO_PSPAG_ID) {
      this.parametrosService.get('parametro?query=TipoParametroId:' + environment.PERFIL_CONTRATISTA_ID + '&ParametroPadreId:' + id_contrato + '&limit=0').subscribe((Response: any) => {
        if (Response.Status == "200") {
          this.perfilContratista = Response.Data;
        }
      });
    }
  }

  // Método para manejar la entrada de solo números
  validateOnlyNumbers(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'
    ];
    const pattern = /^[0-9]$/;

    if (!allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }



  async guardarYContinuar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = this.form.value;

    localStorage.setItem('contrato-general', JSON.stringify({...formData, id: this.formId}));

    this.isLoading = true;

    const saveOperation = this.formId
      ? this.contratoGeneralCrudService.put(this.formId, formData)
      : this.contratoGeneralCrudService.post(formData);

    saveOperation.subscribe({
      next: (response: ApiResponse<any>) => {
        Swal.fire({
          icon: 'success',
          title: 'Datos guardados',
          text: 'Los datos se guardaron correctamente. IDs: ' + response.Data.id,
        });
        this.isLoading = false;
        this.nextStep.emit();
      },
      error: (error) => {
        this.isLoading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error al guardar los datos',
          text: 'Ocurrió un error al guardar los datos',
        });
        console.error('Error saving data:', error);
      }
    });

  }

  onInView(inView: boolean) {
    if (inView) {
      this.loadSavedData();
    }
  }

  private handleError(error: any): void {
    this.isLoading = false;
    Swal.fire({
      icon: 'error',
      title: 'Error al cargar los datos iniciales',
      text: 'Ocurrió un error al cargar los datos iniciales',
    });
    console.error('Error loading initial data:', error);
  }
}
