import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { combineLatest, Observable, startWith } from 'rxjs';


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
  fifthFormGroup = this._formBuilder.group({
    vigencia: [''],
    cdp: [''],
    valorAcumulado: ['']
  });

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

  toggleInput() {
    this.habilitarInput = !this.habilitarInput;
  }

  checked = true;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
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
    const vigencia$ = this.fifthFormGroup.get('vigencia')?.valueChanges.pipe(startWith(''));
    const cdp$ = this.fifthFormGroup.get('cdp')?.valueChanges.pipe(startWith(''));
    const valorAcumulado$ = this.fifthFormGroup.get('valorAcumulado')?.valueChanges.pipe(startWith(''));

    return combineLatest([vigencia$, cdp$, valorAcumulado$]);
  }

}
