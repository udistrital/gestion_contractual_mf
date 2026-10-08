import { Component, OnInit, OnDestroy, OnChanges, Input, SimpleChanges } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  FormArray,
} from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PolizasService } from '../../../../services/polizas.service';
import { ParametrosService } from '../../../../services/parametros.service';
import { Subscription, firstValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertService } from '../../../../services/alert.service';
import { abrirVentanaPdf, mostrarPdfEnVentana } from '../../../../utils/visor-pdf';

interface Amparo {
  id: number;
  descripcion: string;
  tipo_valor_amparo_id: number;
  suficiencia: string;
  poliza_id: number | null;
  valor: string | null;
  fecha_inicio: Date | null;
  fecha_fin: Date | null;
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
export class AmparoContratoComponent implements OnInit, OnChanges, OnDestroy {
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

  /** Póliza a la que se vinculan los amparos. Sin ella no se puede registrar. */
  @Input() polizaId: number | null = null;

  form: FormGroup;
  amparosDisponibles: Amparo[] = [];
  /** Todos los amparos activos del contrato, tal como los devuelve el MID. */
  private todosLosAmparos: Amparo[] = [];
  /** Ids ya vinculados a `polizaId` al momento de cargar, para el diff al registrar. */
  private idsVinculadosOriginales: number[] = [];
  displayedColumns = [
    'id',
    'amparo',
    'tipo_valor_amparo',
    'suficiencia',
    'valor',
    'fecha_inicio',
    'fecha_fin',
    'acciones',
  ];
  dataSource: MatTableDataSource<Amparo>;
  isRegistrando = false;
  generandoBorrador = false;
  private subscription: Subscription = new Subscription();
  private amparosParametros: AmparoParametro[] = [];

  constructor(
    private fb: FormBuilder,
    private polizasService: PolizasService,
    private parametrosService: ParametrosService,
    private snackBar: MatSnackBar,
    private alertService: AlertService
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
          catchError((error: any) => {
            console.error('Error loading amparos parametros:', error);
            this.showErrorMessage('Error al cargar los parámetros de amparos');
            return [];
          })
        )
        .subscribe((amparos: AmparoParametro[]) => {
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
          map((response: any) => {
            if (!response || !response.Data || response.Data.length === 0) {
              throw new Error('NO_AMPAROS');
            }
            return response.Data as Amparo[];
          }),
          catchError((error: any) => {
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
        .subscribe((amparos: Amparo[]) => {
          this.todosLosAmparos = amparos;
          this.aplicarSeparacionPorPoliza();
        })
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['polizaId'] && !changes['polizaId'].firstChange) {
      this.aplicarSeparacionPorPoliza();
    }
  }

  /**
   * Separa los amparos del contrato entre los ya vinculados a `polizaId`
   * (precargados en la tabla) y los disponibles para agregar.
   */
  private aplicarSeparacionPorPoliza() {
    this.updateForm();

    if (this.polizaId) {
      const vinculados = this.todosLosAmparos.filter(
        (a) => a.poliza_id === this.polizaId
      );
      this.idsVinculadosOriginales = vinculados.map((a) => a.id);
      vinculados.forEach((amparo) => this.addAmparoToForm(amparo));
      this.amparosDisponibles = this.todosLosAmparos.filter(
        (a) => a.poliza_id !== this.polizaId
      );
    } else {
      this.idsVinculadosOriginales = [];
      this.amparosDisponibles = [...this.todosLosAmparos];
    }
  }

  private showErrorMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  private showInfoMessage(message: string) {
    this.snackBar.open(message, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
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
        // 1 = SMLV, 2 = Porcentaje (ver amparo-poliza.entity.ts)
        amparo.tipo_valor_amparo_id === 1 ? 'SMLV' : 'Porcentaje',
      ],
      suficiencia: [amparo.suficiencia],
      valor: [amparo.valor || '', Validators.required],
      fecha_inicio: [
        amparo.fecha_inicio ? new Date(amparo.fecha_inicio) : null,
        Validators.required,
      ],
      fecha_fin: [
        amparo.fecha_fin ? new Date(amparo.fecha_fin) : null,
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

  /**
   * Vincula a `polizaId` los amparos que quedaron en la tabla y desvincula
   * (poliza_id: null) los que estaban vinculados y el usuario quitó. Con los
   * mismos datos genera el acta de aprobación y la guarda, así que antes se
   * pide confirmación.
   */
  async registrarAmparos() {
    if (!this.polizaId) {
      this.showErrorMessage('Primero guarde los datos básicos de la póliza');
      return;
    }

    if (this.amparosFormArray.invalid) {
      this.amparosFormArray.markAllAsTouched();
      return;
    }

    const confirmacion = await this.alertService.showConfirmAlert(
      'Se registrarán los amparos y, con estos mismos datos, se generará el ' +
        'acta de aprobación de la póliza, que quedará guardada en el gestor ' +
        'documental y asociada al contrato. Si desea revisarla antes, use el ' +
        'botón "Ver" para la previsualización del acta.',
      '¿Registrar los amparos y guardar el acta?'
    );
    if (!confirmacion?.isConfirmed) return;

    this.isRegistrando = true;
    try {
      const filas = this.amparosFormArray.value as Array<{
        id: number;
        valor: string;
        fecha_inicio: Date | string;
        fecha_fin: Date | string;
      }>;
      const idsActuales = filas.map((fila) => fila.id);
      const idsDesvinculados = this.idsVinculadosOriginales.filter(
        (id) => !idsActuales.includes(id)
      );

      for (const fila of filas) {
        await firstValueFrom(
          this.polizasService.putAmparo(fila.id, {
            poliza_id: this.polizaId,
            valor: Number(fila.valor),
            fecha_inicio: this.toIsoDate(fila.fecha_inicio),
            fecha_fin: this.toIsoDate(fila.fecha_fin),
          })
        );
      }

      for (const id of idsDesvinculados) {
        await firstValueFrom(
          this.polizasService.putAmparo(id, { poliza_id: null })
        );
      }

      this.showInfoMessage('Amparos registrados correctamente para la póliza');
      this.loadAmparos();
      await this.guardarActaAprobacion();
    } catch (error) {
      this.showErrorMessage('Ocurrió un error al registrar los amparos');
    } finally {
      this.isRegistrando = false;
    }
  }

  /**
   * Muestra un borrador del acta de aprobación con los amparos tal como están
   * en la tabla (aún sin registrar), en una ventana con el visor del navegador.
   */
  verBorrador() {
    if (!this.polizaId) {
      this.showErrorMessage('Primero guarde los datos básicos de la póliza');
      return;
    }
    if (this.amparosFormArray.invalid) {
      this.amparosFormArray.markAllAsTouched();
      this.showErrorMessage(
        'Hay amparos incompletos (nombre, valor o fechas). Revíselos para ver el borrador'
      );
      return;
    }

    const ventana = abrirVentanaPdf('Borrador del acta de aprobación');
    if (!ventana) {
      this.showErrorMessage(
        'El navegador bloqueó la ventana emergente. Permítala e intente de nuevo.'
      );
      return;
    }

    const filas = (this.amparosFormArray.value as any[]).map((fila) => ({
      id: fila.id,
      valor: Number(fila.valor),
      fecha_inicio: this.toIsoDate(fila.fecha_inicio),
      fecha_fin: this.toIsoDate(fila.fecha_fin),
    }));

    this.generandoBorrador = true;
    this.polizasService
      .getBorradorActaAprobacion(Number(this.contratoId), filas)
      .subscribe({
        next: (response: any) => {
          this.generandoBorrador = false;
          if (!response?.Success || !response?.Data) {
            ventana.close();
            this.showErrorMessage(
              response?.Message || 'No fue posible generar el borrador del acta'
            );
            return;
          }
          mostrarPdfEnVentana(ventana, response.Data);
        },
        error: () => {
          this.generandoBorrador = false;
          ventana.close();
          this.showErrorMessage('Error al generar el borrador del acta');
        },
      });
  }

  /**
   * Genera el acta definitiva con la póliza y amparos ya registrados, la sube
   * al gestor documental y la registra en el contrato.
   */
  private async guardarActaAprobacion() {
    const contratoId = Number(this.contratoId);
    try {
      const acta: any = await firstValueFrom(
        this.polizasService.getActaAprobacionPoliza(contratoId)
      );
      if (!acta?.Success || !acta?.Data) {
        this.showErrorMessage(
          `Amparos registrados, pero no se generó el acta: ${acta?.Message || 'error desconocido'}`
        );
        return;
      }

      const subida: any = await firstValueFrom(
        this.polizasService.subirActa(contratoId, acta.Data)
      );
      if (subida?.Status !== '200' || !subida?.res?.Id) {
        this.showErrorMessage(
          'Amparos registrados, pero no se pudo guardar el acta en el gestor documental'
        );
        return;
      }

      await firstValueFrom(
        this.polizasService.registrarDocumentoActa(
          contratoId,
          subida.res.Id,
          subida.res.Enlace
        )
      );
      this.showInfoMessage('Póliza registrada y acta de aprobación guardada');
    } catch (error) {
      this.showErrorMessage(
        'Amparos registrados, pero ocurrió un error al guardar el acta de aprobación'
      );
    }
  }

  private toIsoDate(value: Date | string | null): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }

  ngOnInit() {
    this.loadAmparosParametros();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}