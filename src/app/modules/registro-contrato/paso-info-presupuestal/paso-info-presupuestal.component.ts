import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, firstValueFrom, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { CdpsService } from 'src/app/services/cdps.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from '../../../services/contrato-general-crud.service';
import { CDP, CDPContratoCRUD } from '../../../types/types';
import { OrdenadoresSupervisoresContratacionMidService } from 'src/app/services/ordenadores-supervisores-contratacion-mid.service';
import { cdpConstructorTabla } from './paso-info-presupuestal.utilidades';
import { AlertService } from 'src/app/services/alert.service';

interface CDPData {
  vigencia: string;
  numero_necesidad: string;
  estado_necesidad: string;
  numero_disponibilidad: string;
  estadocdp: string;
  nombre_dependencia: string;
  id_necesidad: string;
}

interface OrdenadorContratoData {
  tercero_id?: number;
  ordenador_argo_id: number;
  ordenador_sikarca_id: number;
  resolucion?: string;
  documento_identidad: string;
  cargo_id: number;
  contrato_general_id: number;
}

@Component({
  selector: 'app-paso-info-presupuestal',
  templateUrl: './paso-info-presupuestal.component.html',
  styleUrls: ['./paso-info-presupuestal.component.css'],
})
export class PasoInfoPresupuestalComponent implements OnInit {
  @Output() stepCompleted = new EventEmitter<boolean>();
  @Output() nextStep = new EventEmitter<void>();

  unidadEjecutora: string = '01'; //Valor que debe ser obtenido de algún flujo superior.
  contratoGeneralId: number | null = null;

  firstTime = true;

  form = this._formBuilder.group({
    vigencia: [''],
    cdp: [''],
    valorAcumulado: [{ value: 0, disabled: true }],
    tipoMoneda: ['', Validators.required],
    valorContrato: ['', Validators.required],
    ordenadorGasto: ['', Validators.required],
    nombreOrdenador: [{ value: '', disabled: true }, [Validators.required]],
    tipoGasto: ['', Validators.required],
    origenRecurso: ['', Validators.required],
    origenPresupuesto: ['', Validators.required],
    temaGasto: ['', Validators.required],
    monedaExtranjera: ['', Validators.required],
    tasaCambio: [''],
    medioPago: ['', Validators.required],
  });

  monedas: any[] = [];
  gastos: any[] = [];
  origen_recursos: any[] = [];
  origen_presupuestos: any[] = [];
  tema_gasto: any[] = [];
  medios_pago: any[] = [];

  showCambioMonedaFields = false;

  vigencias: any[] = [{ value: '2024', viewValue: '2024' }];

  cdps: any[] = [];

  displayedColumns: string[] = [
    'vigencia',
    'solicitudNecesidad',
    'numeroCDP',
    'valor',
    'dependencia',
    'rubro',
    'estado',
    'acciones',
  ];

  selectedCDP: CDP[] = []; // Lista de CDPs seleccionados (Tabla)
  cdpsContrato: CDPContratoCRUD[] = []; // Lista de CDPs asociados al contrato general

  checked = true;

  private destroy$ = new Subject<void>();

  isLoading = false;

  ordenadores: any[] = [];
  nombreOrdenador: any[] = [];

  private formId: number | null = null;

  cdpConstructorTabla: any;
  tablaCdpColumnas: any;

  documentoIdentidadOrdenador: string | null = null;
  cargoIdOrdenador: number | null = null;
  idSikarcaOrdenador: number | null = null;

  constructor(
    private _formBuilder: FormBuilder,
    private alertService: AlertService,
    private parametrosService: ParametrosService,
    private cdRef: ChangeDetectorRef,
    private cdpsService: CdpsService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private ordenadoresSupervisoresMidService: OrdenadoresSupervisoresContratacionMidService
  ) {}

  ngOnInit() {
    this.cargarCDPs();
    this.setupVigenciaListener();
    this.setupCdpListener();
    this.CargarMonedas();
    this.CargarGastos();
    this.CargarOrigenRecursos();
    this.CargarOrigenPresupuesto();
    this.CargarTemaGasto();
    this.CargarMediosPago();
    this.CargarRolOrdenadores();
    this.loadSavedData();

    this.form.get('tipoMoneda')?.valueChanges.subscribe((id_moneda) => {
      if (id_moneda) {
        this.CambioMoneda(id_moneda);
      }
    });

    this.form.get('ordenadorGasto')?.valueChanges.subscribe((rol) => {
      if (rol) {
        console.log('Si se llama a la función con el rol' + Number(rol));
        this.CargarOrdenadorActuales(Number(rol));
      }
    });

    this.form.statusChanges.subscribe(() => {
      this.stepCompleted.emit(this.form.valid);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSavedData(): void {
    console.log('Loading saved data...');
    try {
      const savedForm = localStorage.getItem('paso-info-presupuestal');
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        this.formId = parsedForm.id;

        const formValues = {
          tipoGasto: parsedForm.tipo_gasto_id,
          origenPresupuesto: parsedForm.origen_presupuestos_id,
          temaGasto: parsedForm.tema_gasto_inversion_id,
          medioPago: parsedForm.medio_pago_id,
          tipoMoneda: parsedForm.tipo_moneda_id,
          valorContrato: parsedForm.valor_pesos,
          origenRecurso: parsedForm.origen_recursos_id,
        };

        console.log('Loading values into form:', formValues);
        this.form.patchValue(formValues);

        this.contratoGeneralId = parsedForm.id;

        if (this.contratoGeneralId) {
          this.cargarCDPsContrato(this.contratoGeneralId);
        }
      }

      const infoGeneral = localStorage.getItem('paso-info-general');
      if (infoGeneral) {
        const contratoData = JSON.parse(infoGeneral);
        this.contratoGeneralId = contratoData.id;
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
      localStorage.removeItem('paso-info-presupuestal');
    }
  }

  async guardarYContinuar() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isLoading = true;

      // Datos para la información presupuestal
      const formData = {
        tipo_gasto_id: this.form.get('tipoGasto')?.value,
        origen_presupuestos_id: this.form.get('origenPresupuesto')?.value,
        tema_gasto_inversion_id: this.form.get('temaGasto')?.value,
        medio_pago_id: this.form.get('medioPago')?.value,
        tipo_moneda_id: this.form.get('tipoMoneda')?.value,
        valor_pesos: this.form.get('valorContrato')?.value,
        origen_recursos_id: this.form.get('origenRecurso')?.value,
      };

      // Obtener el ID del contrato del localStorage
      const infoGeneral = localStorage.getItem('paso-info-general');
      if (!infoGeneral) {
        throw new Error('No se ha encontrado información general del contrato');
      }

      const contratoData = JSON.parse(infoGeneral);
      const contratoId = contratoData.id;

      if (!contratoId) {
        throw new Error('No se ha encontrado el ID del contrato');
      }

      const ordenadorGastoId = this.form.get('ordenadorGasto')?.value;

      // Preparar datos para el POST de OrdenadorContrato
      const ordenadorContratoData: OrdenadorContratoData = {
        ordenador_argo_id: ordenadorGastoId ? Number(ordenadorGastoId) : 0,
        ordenador_sikarca_id: this.idSikarcaOrdenador
          ? Number(this.idSikarcaOrdenador)
          : 0,
        documento_identidad: this.documentoIdentidadOrdenador || '',
        cargo_id: this.cargoIdOrdenador || 0,
        contrato_general_id: contratoId,
      };

      // Realizar el POST al endpoint de OrdenadorContrato
      const ordenadorContratoResponse = await firstValueFrom(
        this.contratoGeneralCrudService.postOrdenadorContrato(
          ordenadorContratoData
        )
      );

      // Actualizar en el backend la información presupuestal
      const response = await firstValueFrom(
        this.contratoGeneralCrudService.put(contratoId, formData)
      );

      // Guardar en localStorage
      localStorage.setItem(
        'paso-info-presupuestal',
        JSON.stringify({
          ...formData,
          id: contratoId,
        })
      );

      this.alertService.showSuccessAlert(
        'La información presupuestal se ha guardado correctamente',
        'Datos guardados'
      );

      this.nextStep.emit();
    } catch (error) {
      console.error('Error saving data:', error);
      this.alertService.showErrorAlert(
        'Ocurrió un error al guardar la información presupuestal',
        'Error al guardar'
      );
    } finally {
      this.isLoading = false;
      this.cdRef.detectChanges();
    }
  }

  private cargarCDPsContrato(contratoId: number) {
    if (this.firstTime) {
      return;
    }
    this.contratoGeneralCrudService
      .getCdpContrato(contratoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response && response.Data) {
            this.cdpsContrato = response.Data;
          }
        },
        error: (error) => {
          console.error('Error loading CDPs:', error);
        },
      });
  }

  cargarCDPs() {
    this.cdpConstructorTabla = cdpConstructorTabla;
    this.tablaCdpColumnas = this.cdpConstructorTabla.map(
      (column: any) => column.columnDef
    );
    const localCDPs = this.cdpsService.getLocalCDP();
    if (localCDPs && localCDPs.length > 0) {
      this.selectedCDP = localCDPs;
      this.updateValorAcumulado();
      this.removeSelectedCDPsFromList();
    }
  }

  setupVigenciaListener() {
    this.form
      .get('vigencia')
      ?.valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((vigencia) => {
        if (vigencia) {
          this.obtenerNumeroDisponibilidad(vigencia);
        }
      });
  }

  setupCdpListener() {
    this.form
      .get('cdp')
      ?.valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((cdp) => {
        const vigencia = this.form.get('vigencia')?.value;
        if (cdp && vigencia) {
          this.obtenerCDP(vigencia, cdp);
        }
      });
  }

  obtenerNumeroDisponibilidad(vigencia: string) {
    this.isLoading = true;
    this.cdps = [];
    this.form.get('cdp')?.reset();

    this.cdpsService
      .get(
        `cdps/numeros-disponibilidad?vigencia=${vigencia}&unidadEjecutora=${this.unidadEjecutora}`
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.Status === 200) {
            const uniqueCDPs = new Map<string, CDPData>();

            response.Data.forEach((cdp: CDPData) => {
              if (
                cdp.estadocdp !== 'AGOTADO' &&
                !uniqueCDPs.has(cdp.numero_disponibilidad)
              ) {
                uniqueCDPs.set(cdp.numero_disponibilidad, cdp);
              }
            });

            this.cdps = Array.from(uniqueCDPs.values()).map((cdp) => ({
              value: cdp.numero_disponibilidad,
              viewValue: cdp.numero_disponibilidad,
            }));

            this.sortCDPs();
          } else {
            console.error('Error loading CDPs:', response.Message);
          }
        },
        error: (error) => {
          console.error('Error loading CDPs:', error);
        },
      });
  }

  obtenerCDP(vigencia: string, numeroDisponibilidad: string) {
    this.isLoading = true;
    this.cdpsService
      .get(
        `cdps?vigencia=${vigencia}&unidadEjecutora=${this.unidadEjecutora}&numeroDisponibilidad=${numeroDisponibilidad}`
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.Status === 200) {
            const newCDP = response.Data[0]; //La respuesta puede retornar varias veces el mismo CDP
            this.selectedCDP = [...this.selectedCDP, newCDP];
            this.updateValorAcumulado();
            this.removeSelectedCDPsFromList();
            this.form.get('cdp')?.reset();
          } else {
            console.error('Error loading row data:', response.Message);
          }
        },
        error: (error) => {
          console.error('Error loading row data:', error);
        },
      });
  }

  removeSelectedCDPsFromList() {
    this.cdps = this.cdps.filter(
      (cdp) =>
        !this.selectedCDP.some(
          (selected) => selected.numero_disponibilidad === cdp.value
        )
    );
  }

  async guardarListaCDP() {
    if (!this.contratoGeneralId) {
      this.alertService.showErrorAlert(
        'No se ha encontrado información general del contrato. PIP3'
      );
      return;
    }

    try {
      //Guardar en localStorage
      this.cdpsService.updateLocalCDP(this.selectedCDP);

      this.firstTime = false;

      //Preparamos el guardado en el api
      const cdpsGuardarCrud: CDPContratoCRUD[] = this.selectedCDP.map(
        (cdp) => ({
          numero_cdp_id: parseInt(cdp.numero_disponibilidad),
          fecha_registro: new Date(),
          vigencia_cdp: parseInt(cdp.vigencia),
          contrato_general_id: this.contratoGeneralId,
        })
      );

      const promesasGuardado = cdpsGuardarCrud.map((cdp) =>
        firstValueFrom(this.contratoGeneralCrudService.postCdp(cdp))
      );

      await Promise.all(promesasGuardado);

      this.alertService.showSuccessAlert(
        'Los CDPs ha sido guardada correctamente (local y en el servidor)'
      );
    } catch (error) {
      this.alertService.showErrorAlert(
        'No se ha podido guardar la lista de CDPs'
      );
    }
  }

  updateValorAcumulado() {
    const valorAcumulado = this.selectedCDP.reduce((sum, row) => {
      const valor =
        typeof row.valor_contratacion === 'string'
          ? parseFloat(row.valor_contratacion)
          : row.valor_contratacion || 0;
      return sum + valor;
    }, 0);

    this.form.get('valorAcumulado')?.setValue(valorAcumulado);
  }

  CargarMonedas() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.TIPO_MONEDA +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.monedas = Response.Data;
        }
      });
  }

  CargarGastos() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.TIPO_GASTO_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.gastos = Response.Data;
        }
      });
  }

  CargarOrigenRecursos() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.ORIGEN_RECURSOS_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.origen_recursos = Response.Data;
        }
      });
  }

  CargarOrigenPresupuesto() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.ORIGEN_PRESUPUESTO_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.origen_presupuestos = Response.Data;
        }
      });
  }

  CargarTemaGasto() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.TEMA_GASTO_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.tema_gasto = Response.Data;
        }
      });
  }

  CargarMediosPago() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.MEDIO_PAGO_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.medios_pago = Response.Data;
        }
      });
  }

  CargarRolOrdenadores() {
    this.ordenadoresSupervisoresMidService
      .getRolOrdenadores()
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.ordenadores = Response.Data;
        }
      });
  }

  CargarOrdenadorActuales(rol: number) {
    this.ordenadoresSupervisoresMidService
      .getOrdenadorActuales(rol)
      .subscribe(async (Response: any) => {
        console.log('Respuesta de ordenadores', Response);
        if (Response.Status == '200') {
          this.form
            .get('nombreOrdenador')
            ?.setValue(Response.Data[0].nombre_ordenador);
        } else {
          this.form.get('ordenadorGasto')?.reset();
          this.form.get('nombreOrdenador')?.reset();
          this.alertService.showErrorAlert(
            'No se encontraron ordenadores para el rol seleccionado'
          );
        }
      });
  }

  CambioMoneda(id_moneda: string) {
    const idMonedaStr = id_moneda.toString();

    this.showCambioMonedaFields =
      idMonedaStr !== environment.PESO_COLOMBIANO_ID;

    const monedaFields = ['monedaExtranjera', 'tasaCambio'];

    [...monedaFields].forEach((field) => {
      const control = this.form.get(field);
      if (control) {
        control.reset();
        if (this.showCambioMonedaFields && monedaFields.includes(field)) {
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

  // Método para manejar la entrada de solo números

  onlyNumbers(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];
    const pattern = /^[0-9]$/;

    if (!allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  sortCDPs() {
    this.cdps.sort((a, b) => {
      const numA = parseInt(a.value, 10);
      const numB = parseInt(b.value, 10);
      return numA - numB;
    });
  }

  async eliminarCDP(cdpAEliminar: CDP) {
    try {
      if (this.contratoGeneralId) {
        const cdpContrato = this.cdpsContrato.find(
          (c) =>
            c.numero_cdp_id === parseInt(cdpAEliminar.numero_disponibilidad)
        );

        if (cdpContrato && cdpContrato.id) {
          await firstValueFrom(
            this.contratoGeneralCrudService.deleteCdp(cdpContrato.id)
          );
        }

        this.selectedCDP = this.selectedCDP.filter(
          (cdp) =>
            cdp.numero_disponibilidad !== cdpAEliminar.numero_disponibilidad
        );

        this.updateValorAcumulado();

        this.cdps.push({
          value: cdpAEliminar.numero_disponibilidad,
          viewValue: cdpAEliminar.numero_disponibilidad,
        });

        this.cdpsService.updateLocalCDP(this.selectedCDP);

        this.sortCDPs();

        await this.alertService.showSuccessAlert('CDP eliminado correctamente');
      }
    } catch (error) {
      this.alertService.showErrorAlert('Hubo un error al eliminar el CDP');
    }

    this.form.get('cdp')?.reset();
  }

  async onInView(inView: boolean) {
    if (inView) {
      this.loadSavedData();
    } else {
      console.log('Paso Info Presupuestal - out of view');
    }
  }
}
