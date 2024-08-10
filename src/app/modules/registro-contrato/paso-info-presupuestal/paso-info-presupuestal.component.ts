import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { combineLatest, Observable, startWith, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import {CdpsService} from "../../../services/cdps.service";

export interface RowData {
  vigencia: string;
  num_sol_adq: string;
  numero_disponibilidad: string;
  valor_contratacion: number;
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
    vigencia: [''],
    cdp: [''],
    valorAcumulado: [{ value: '', disabled: true}],
  });

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
    private cdpsService: CdpsService
  ) { }

  ngOnInit() {
    this.setupVigenciaListener();
    this.setupCdpListener();
    // TODO: Validar datos guardados en caso de que existan
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
    }
  }

}
