import {ChangeDetectorRef, Component} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import { combineLatest, Observable, startWith, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import {CdpsService} from "src/app/services/cdps.service";
import {ParametrosService} from "src/app/services/parametros.service";
import {environment} from "src/environments/environment";

export interface RowData {
  vigencia: string;
  num_sol_adq: string;
  numero_disponibilidad: string;
  valor_contratacion: number | string;
  nombre_dependencia: string;
  descripcion: string;
  estado: string;
}

@Component({
  selector: 'app-paso-info-presupuestal',
  templateUrl: './paso-info-presupuestal.component.html',
  styleUrls: ['./paso-info-presupuestal.component.css'],
})


export class PasoInfoPresupuestalComponent {

  unidadEjecutora: string = '01'; //Valor que debe ser obtenido de algún flujo superior.

  form = this._formBuilder.group({
    vigencia: ['', Validators.required],
    cdp: ['', Validators.required],
    valorAcumulado: [{value: 0, disabled: true}, Validators.required],
    tipoMoneda: ['', Validators.required],
    valorContrato: ['', Validators.required],
    resolucion: [''],
    ordenadorGasto: ['', Validators.required],
    nombreOrdenador: ['', Validators.required],
    tipoGasto: ['', Validators.required],
    origenRecurso: ['', Validators.required],
    origenPresupuesto: ['', Validators.required],
    temaGasto: ['', Validators.required],
    monedaExtranjera: ['', Validators.required],
    tasaCambio: ['', Validators.required],
    medioPago: ['', Validators.required],
  });

  monedas: any[] = [];
  resoluciones: any[] = [];
  ordenadores: any[] = [];
  gastos: any[] = [];
  origen_recursos: any[] = [];
  origen_presupuestos: any[] = [];
  tema_gasto: any[] = [];
  medios_pago: any[] = [];

  showCambioMonedaFields = false;


  vigencias: any[] = [
    { value: '2023', viewValue: '2023' },
    { value: '2024', viewValue: '2024' },
    { value: '2025', viewValue: '2025' },
  ];

  cdps: any[] = [];

  displayedColumns: string[] = [
    'vigencia',
    'solicitudNecesidad',
    'numeroCDP',
    'valor',
    'dependencia',
    'rubro',
    'estado'
  ];

  dataSource: RowData[] = []; //Vacío o llenandose con datos guardados

  habilitarInput = false;

  toggleInputOrdenador() {
    this.habilitarInput = !this.habilitarInput;
  }


  checked = true;

  private destroy$ = new Subject<void>();

  constructor(
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private cdRef: ChangeDetectorRef,
    private cdpsService: CdpsService
  ) { }

  ngOnInit() {
    this.setupVigenciaListener();
    this.setupCdpListener();
    // TODO: Validar datos guardados en caso de que existan

    this.CargarMonedas();
    this.CargarGastos();
    this.CargarOrigenRecursos();
    this.CargarOrigenPresupuesto();
    this.CargarTemaGasto();
    this.CargarMediosPago();

    this.form.get('tipoMoneda')?.valueChanges.subscribe((id_moneda) => {
      if(id_moneda){
        this.CambioMoneda(id_moneda);
      }
    })

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupVigenciaListener() {
    this.form.get('vigencia')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(vigencia => {
      if (vigencia) {
        this.obtenerNumeroDisponibilidad(vigencia);
      }
    });
  }

  setupCdpListener() {
    this.form.get('cdp')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      distinctUntilChanged()
    ).subscribe(cdp => {
      const vigencia = this.form.get('vigencia')?.value
      if (cdp && vigencia) {
        this.obtenerCDP(vigencia, cdp);
      }
    });

  }

  obtenerNumeroDisponibilidad(vigencia: string) {
    // Se limpian los valores actuales
    this.cdps = [];
    this.form.get('cdp')?.reset();

    this.cdpsService.get(`cdps/numeros-disponibilidad?vigencia=${vigencia}&unidadEjecutora=${this.unidadEjecutora}`).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.Status === 200) {
          this.cdps = response.Data
            .filter((cdp: any) => cdp.estadocdp !== 'AGOTADO')
            .map((cdp: any) => ({
              value: cdp.numero_necesidad,
              viewValue: cdp.numero_necesidad
            }));
        } else {
          console.error('Error loading CDPs:', response.Message);
        }
      },
      error: (error) => {
        console.error('Error loading CDPs:', error);
      }
    });
  }

  obtenerCDP(vigencia: string, numeroDisponibilidad: string) {

      this.cdpsService.get(`cdps?vigencia=${vigencia}&unidadEjecutora=${this.unidadEjecutora}&numeroDisponibilidad=${numeroDisponibilidad}`).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          if (response.Status === 200) {
            this.dataSource = [...this.dataSource, ...response.Data];
            this.updateValorAcumulado();
          } else {
            console.error('Error loading row data:', response.Message);
          }
        },
        error: (error) => {
          console.error('Error loading row data:', error);
        }
      });
  }

  eliminarUltimoRegistroDataCDP() {
    if(this.dataSource.length > 0) {
      const data = this.dataSource;
      data.pop();
      this.dataSource = [...data];
      this.updateValorAcumulado();
    }
  }

  updateValorAcumulado() {
    const valorAcumulado = this.dataSource.reduce((sum, row) => {
      const valor = typeof row.valor_contratacion === 'string'
        ? parseFloat(row.valor_contratacion)
        : row.valor_contratacion || 0;
      return sum + valor;
    }, 0);

    this.form.get('valorAcumulado')?.setValue(valorAcumulado);
  }

  CargarMonedas(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_MONEDA + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.monedas = Response.Data;
      }
    })
  }

  CargarGastos(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_GASTO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.gastos = Response.Data;
      }
    })
  }

  CargarOrigenRecursos(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.ORIGEN_RECURSOS_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.origen_recursos = Response.Data;
      }
    })
  }

  CargarOrigenPresupuesto(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.ORIGEN_PRESUPUESTO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.origen_presupuestos = Response.Data;
      }
    })
  }

  CargarTemaGasto(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TEMA_GASTO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tema_gasto = Response.Data;
      }
    })
  }

  CargarMediosPago(){
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.MEDIO_PAGO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.medios_pago = Response.Data;
      }
    })
  }

  CambioMoneda(id_moneda: string){
    const idMonedaStr = id_moneda.toString();

    this.showCambioMonedaFields = idMonedaStr !== environment.PESO_COLOMBIANO_ID;

    const monedaFields = ['monedaExtranjera', 'tasaCambio'];

    [...monedaFields].forEach(field => {
      const control = this.form.get(field);
      if (control) {
        control.reset();
        if ((this.showCambioMonedaFields && monedaFields.includes(field))) {
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
      'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'
    ];
    const pattern = /^[0-9]$/;

    if (!allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }

}
