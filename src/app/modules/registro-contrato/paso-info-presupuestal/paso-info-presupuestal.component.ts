import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { combineLatest, Observable, startWith } from 'rxjs';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';


export interface RowData {
  vigencia: string;
  solicitudNecesidad: string;
  numeroCDP: string;
  valor: number;
  dependencia: string;
  rubro: string;
}

const EXAMPLE_DATA: RowData[] = [
  { vigencia: '2023', solicitudNecesidad: 'SN-001', numeroCDP: 'CDP-001', valor: 10000, dependencia: 'Departamento A', rubro: 'Rubro 1' },
  { vigencia: '2023', solicitudNecesidad: 'SN-002', numeroCDP: 'CDP-002', valor: 20000, dependencia: 'Departamento B', rubro: 'Rubro 2' },
  { vigencia: '2024', solicitudNecesidad: 'SN-001', numeroCDP: 'CDP-001', valor: 10000, dependencia: 'Departamento C', rubro: 'Rubro 3' },
  { vigencia: '2024', solicitudNecesidad: 'SN-002', numeroCDP: 'CDP-002', valor: 20000, dependencia: 'Departamento D', rubro: 'Rubro 4' },
];


@Component({
  selector: 'app-paso-info-presupuestal',
  templateUrl: './paso-info-presupuestal.component.html',
  styleUrls: ['./paso-info-presupuestal.component.css'],
})

export class PasoInfoPresupuestalComponent {
  showCambioMonedaFields = false;

  constructor(private _formBuilder: FormBuilder, private parametrosService: ParametrosService, private cdRef: ChangeDetectorRef) { }

  form = this._formBuilder.group({
    vigencia: ['', Validators.required],
    cdp: ['', Validators.required],
    valorAcumulado: ['', Validators.required],
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

  vigencias: any[] = [
    { value: '2023', viewValue: '2023' },
    { value: '2024', viewValue: '2024' },
    { value: '2025', viewValue: '2025' },
  ];

  cdps: any[] = [
    { value: 'CDP-001', viewValue: 'CDP-001' },
    { value: 'CDP-002', viewValue: 'CDP-002' },
    { value: 'CDP-003', viewValue: 'CDP-003' },
  ];

  datosContratista: any = {};

  displayedColumns: string[] = [
    'vigencia',
    'solicitudNecesidad',
    'numeroCDP',
    'valor',
    'dependencia',
    'rubro',
  ];

  dataSource = EXAMPLE_DATA;

  filteredDataSource: RowData[] = [];

  habilitarInput = false;

  toggleInputOrdenador() {
    this.habilitarInput = !this.habilitarInput;
  }

  checked = true;

  ngOnInit() {

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

    this.applyFilters().subscribe(([vigencia, cdp, valorAcumulado]) => {
      this.filteredDataSource = this.dataSource.filter(row => {
        const vigenciaMatch = !vigencia || row.vigencia === vigencia;
        const cdpMatch = !cdp || row.numeroCDP === cdp;
        const valorMatch = !valorAcumulado || row.valor === Number(valorAcumulado);
        return vigenciaMatch && cdpMatch && valorMatch;
      });
    });
  }

  applyFilters(): Observable<any> {
    const vigencia$ = this.form.get('vigencia')?.valueChanges.pipe(startWith(''));
    const cdp$ = this.form.get('cdp')?.valueChanges.pipe(startWith(''));
    const valorAcumulado$ = this.form.get('valorAcumulado')?.valueChanges.pipe(startWith(''));

    return combineLatest([vigencia$, cdp$, valorAcumulado$]);
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
