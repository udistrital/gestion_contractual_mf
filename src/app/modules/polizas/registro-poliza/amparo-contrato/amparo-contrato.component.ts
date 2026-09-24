import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PolizasService } from '../../../services/polizas.service';
import { ParametrosService } from '../../../services/parametros.service';
import { Subscription } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Amparo {
  id: number;
  descripcion: string;
  tipo_valor_amparo_id: number;
  suficiencia: string;
  valor: string;
  fecha_inicio: Date | null;
  fecha_final: Date | null;
  amparo: string | null;
}

interface AmparoParametro {
  Id: number;
  Nombre: string;
  CodigoAbreviacion: string;
}

@Component({
  selector: 'app-amparo-contrato',
  templateUrl: './amparo-contrato.component.html',
  styleUrls: ['./amparo-contrato.component.css'],
  standalone: false,
})
export class AmparoContratoComponent implements OnInit, OnDestroy {
  @Input() set contratoId(value: string | null) {
    this._contratoId = value;
    if (value) {
      this.loadAmparosParametros();
    }
  }
  get contratoId(): string | null {
    return this._contratoId;
  }
  private _contratoId: string | null = null;

  form: FormGroup;
  amparosDisponibles: Amparo[] = [];
  displayedColumns = [
    'id',
    'amparo',
    'tipo_valor_amparo',
    'suficiencia',
    'valor',
    'fecha_inicio',
    'fecha_final',
    'acciones',
  ];
  dataSource: MatTableDataSource<Amparo>;
  private subscription: Subscription = new Subscription();
  private amparosParametros: AmparoParametro[] = [];

  constructor(
    private fb: FormBuilder,
    private polizasService: PolizasService,
    private parametrosService: ParametrosService,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      amparoSeleccionado: [''],
      amparos: this.fb.array([]),
    });
    this.dataSource = new MatTableDataSource<Amparo>([]);
  }

  private loadAmparosParametros() {
    this.subscription.add(
      this.parametrosService
        .get(`parametro?query=TipoParametroId:${environment.AMPARO_ID}&limit=0`)
        .pipe(
          map((response: any) => response.Data as AmparoParametro[]),
          catchError((error) => {
            console.error('Error loading amparos parametros:', error);
            this.showErrorMessage('Error al cargar los parámetros de amparos');
            return [];
          })
        )
        .subscribe((amparos) => {
          this.amparosParametros = amparos;
          if (this.contratoId) {
            this.loadAmparos();
          }
        })
    );
  }

  loadAmparos() {
    if (!this.contratoId) return;

    this.subscription.add(
      this.polizasService
        .getAmparosContratoMid(this.contratoId)
        .pipe(
          map((response) => {
            if (!response || !response.Data || response.Data.length === 0) {
              throw new Error('NO_AMPAROS');
            }
            return response.Data;
          }),
          catchError((error) => {
            if (
              error.status === 404 ||
              error.status === 400 ||
              error.message === 'NO_AMPAROS'
            ) {
              this.showErrorMessage(
                `No se encontraron amparos para el contrato con ID ${this.contratoId}, ` +
                  'por favor completa ese paso en el módulo de registrar contrato'
              );
            } else {
              this.showErrorMessage('Error al cargar los amparos del contrato');
            }

            this.updateForm();
            return [];
          })
        )
        .subscribe((amparos) => {
          this.amparosDisponibles = amparos;
          this.updateForm();
        })
    );
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  updateForm() {
    this.amparosFormArray.clear();
    this.dataSource.data = [];
  }

  addAmparo() {
    const amparoSeleccionadoId = this.form.get('amparoSeleccionado')?.value;
    const amparoIndex = this.amparosDisponibles.findIndex(
      (a) => a.id === amparoSeleccionadoId
    );

    if (amparoIndex > -1) {
      const [amparo] = this.amparosDisponibles.splice(amparoIndex, 1);
      this.addAmparoToForm(amparo);
      this.form.get('amparoSeleccionado')?.setValue('');
    }
  }

  private addAmparoToForm(amparo: Amparo) {
    const amparoGroup = this.fb.group({
      id: [amparo.id],
      descripcion: [amparo.descripcion],
      tipo_valor_amparo: [
        amparo.tipo_valor_amparo_id === 1 ? 'SMLV' : 'Porcentaje',
      ],
      suficiencia: [amparo.suficiencia],
      valor: [amparo.valor || '', Validators.required],
      fecha_inicio: [
        amparo.fecha_inicio ? new Date(amparo.fecha_inicio) : null,
        Validators.required,
      ],
      fecha_final: [
        amparo.fecha_final ? new Date(amparo.fecha_final) : null,
        Validators.required,
      ],
      amparo: [amparo.amparo || '', Validators.required],
    });

    this.amparosFormArray.push(amparoGroup);
    this.updateDataSource();
  }

  removeAmparo(index: number) {
    const removedAmparo = this.amparosFormArray.at(index).value;
    this.amparosDisponibles.push(removedAmparo);
    this.amparosFormArray.removeAt(index);
    this.updateDataSource();
  }

  private updateDataSource() {
    this.dataSource.data = this.amparosFormArray.controls.map(
      (control) => control.value
    );
  }

  get amparosFormArray(): FormArray {
    return this.form.get('amparos') as FormArray;
  }

  getFormControl(index: number, controlName: string): FormControl {
    return this.amparosFormArray.at(index).get(controlName) as FormControl;
  }

  ngOnInit() {
    this.loadAmparosParametros();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
