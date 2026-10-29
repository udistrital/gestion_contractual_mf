import {
  ChangeDetectorRef,
  Component,
  effect,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PolizasService } from 'src/app/services/polizas.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { firstValueFrom } from 'rxjs';
import { AmparoPolizaDto, ApiResponse, ContratoGeneral, ParametroListResponse, ParametroResponse } from 'src/app/types/types';
import { AlertService } from 'src/app/services/alert.service';

@Component({
    selector: 'app-paso-garantias',
    templateUrl: './paso-garantias.component.html',
    styleUrls: ['./paso-garantias.component.css'],
    standalone: false
})
export class PasoGarantiasComponent implements OnInit {
  nextStep = output<void>();
  stepCompleted = output<boolean>();
  contratoGeneral = input<ContratoGeneral>()
  viewMode = input<boolean>(false);

  form: FormGroup;
  datosExitentes = false;
  amparos: ParametroResponse[] = [];
  displayedColumns = ['id', 'amparo', 'suficiencia', 'descripcion', 'acciones'];
  dataSource: MatTableDataSource<FormGroup>;

  private readonly alertService = inject(AlertService);
  private readonly _formBuilder = inject(FormBuilder);
  private readonly parametrosService = inject(ParametrosService);
  private readonly polizasService = inject(PolizasService);
  private readonly cdRef = inject(ChangeDetectorRef);

  constructor(
  ) {
    this.form = this._formBuilder.group({
      filas: this._formBuilder.array([]),
    });
    this.dataSource = new MatTableDataSource<FormGroup>([]);
    effect(() => {
      if (this.contratoGeneral()) {
        this.loadSavedData();
      }
    });
  }

  ngOnInit() {
    this.cargarTipoAmparos();
    this.form.statusChanges.subscribe(() => {
      this.stepCompleted.emit(this.form.valid && this.filasFormArray.length > 0);
    });
    this.aplicarModoVisualizacion();
  }

  /** En modo visualización el formulario queda en solo lectura. */
  private aplicarModoVisualizacion(): void {
    if (this.viewMode()) {
      this.form.disable({ emitEvent: false });
    }
  }

  /** En modo visualización se omite la columna de acciones. */
  get columnasVisibles(): string[] {
    return this.viewMode()
      ? this.displayedColumns.filter((columna) => columna !== 'acciones')
      : this.displayedColumns;
  }

  get totalAmparos(): number {
    return this.filasFormArray.length;
  }

  get amparosValidos(): number {
    return this.filasFormArray.controls.filter((c) => c.valid).length;
  }

  get estadoCobertura(): string {
    if (this.filasFormArray.length === 0) {
      return 'Sin amparos';
    }
    return this.form.valid ? 'Completo' : 'Incompleto';
  }

  private async loadSavedData(): Promise<void> {
    if (this.contratoGeneral()) {
      const response = await firstValueFrom(
        this.polizasService.getAmparos(this.contratoGeneral()?.id as number)
      );

      if (response.Success && response.Data.length > 0) {
        while (this.filasFormArray.length !== 0) {
          this.filasFormArray.removeAt(0);
        }

        response.Data.forEach((amparo: any) => {
          const filaFormGroup = this.crearFilaFormGroup();
          filaFormGroup.patchValue({
            amparo: amparo.amparo_id,
            suficienciaPorcentaje:
              amparo.tipo_valor_amparo_id === 2 ? amparo.suficiencia : '',
            suficienciaSalarios:
              amparo.tipo_valor_amparo_id === 1 ? amparo.suficiencia : '',
            descripcion: amparo.descripcion,
          });

          this.configurarAmparoListener(filaFormGroup);
          this.filasFormArray.push(filaFormGroup);
        });
        this.datosExitentes = true;
        this.actualizarDataSource();
      } else if (!this.viewMode()) {
        this.agregarFila();
      }
      this.aplicarModoVisualizacion();
    }
  }

  /**
   * Guarda las garantías con un diff por fila contra `idsOriginales`: filas
   * nuevas se crean en lote, filas existentes se actualizan una a una y las
   * filas quitadas por el usuario se eliminan (soft delete en el CRUD).
   */
  async guardarYContinuar() {
    if (this.filasFormArray.length === 0) {
      this.alertService.showAlert(
        'Debe registrar al menos un amparo o garantía para el contrato',
        'Atención'
      );
      return;
    }

    if (!this.form.valid) {
      this.markFormGroupTouched(this.form);
      this.alertService.showAlert(
        'Por favor complete todos los campos obligatorios de los amparos',
        'Formulario incompleto'
      );
      return;
    }

    const formData = this.prepareFormData();

    if (!this.contratoGeneral()) {
      this.alertService.showErrorAlert('No se ha encontrado información del contrato');
    }

    let response: ApiResponse<AmparoPolizaDto>;

    if (this.datosExitentes) {
      response = await firstValueFrom(
        this.polizasService.putAmparo(this.contratoGeneral()?.id as number, formData)
      );
    } else {
      response = await firstValueFrom(
        this.polizasService.postAmparos(formData)
      );
    }

    if (response.Success) {
      this.alertService.showSuccessAlert(
        'La información de garantías se ha guardado correctamente',
        'Datos guardados'
      );
    }

    this.nextStep.emit();
  }

  get filasFormArray(): FormArray {
    return this.form.get('filas') as FormArray;
  }

  crearFilaFormGroup(): FormGroup {
    return this._formBuilder.group({
      id: [null],
      amparo: ['', Validators.required],
      suficienciaPorcentaje: ['', Validators.required],
      suficienciaSalarios: [{ value: '', disabled: true }],
      descripcion: ['', Validators.required],
    });
  }

  agregarFila() {
    const nuevaFila = this.crearFilaFormGroup();
    this.filasFormArray.push(nuevaFila);
    this.configurarAmparoListener(nuevaFila);
    this.actualizarDataSource();
    this.stepCompleted.emit(this.form.valid && this.filasFormArray.length > 0);
  }

  eliminarFila(index: number) {
    this.filasFormArray.removeAt(index);
    this.actualizarDataSource();
    this.stepCompleted.emit(this.form.valid && this.filasFormArray.length > 0);
    this.cdRef.detectChanges();
  }

  actualizarDataSource() {
    this.dataSource.data = this.filasFormArray.controls as FormGroup[];
    this.cdRef.detectChanges();
  }

  configurarAmparoListener(filaFormGroup: FormGroup) {
    filaFormGroup.get('amparo')?.valueChanges.subscribe((id_amparo) => {
      if (id_amparo) {
        const idAmparoStr = id_amparo.toString();
        const tipoAmparoIdStr = environment.AMPARO_CREC_ID.toString();

        const suficienciaPorcentajeControl = filaFormGroup.get(
          'suficienciaPorcentaje'
        );
        const suficienciaSalariosControl = filaFormGroup.get(
          'suficienciaSalarios'
        );

        if (idAmparoStr === tipoAmparoIdStr) {
          suficienciaPorcentajeControl?.disable();
          suficienciaPorcentajeControl?.setValue('');
          if (!this.viewMode()) {
            suficienciaSalariosControl?.enable();
          }
          suficienciaSalariosControl?.setValidators(Validators.required);
        } else {
          if (!this.viewMode()) {
            suficienciaPorcentajeControl?.enable();
          }
          suficienciaPorcentajeControl?.setValidators(Validators.required);
          suficienciaSalariosControl?.disable();
          suficienciaSalariosControl?.setValue('');
        }

        suficienciaPorcentajeControl?.updateValueAndValidity();
        suficienciaSalariosControl?.updateValueAndValidity();
        this.cdRef.detectChanges();
      }
    });
  }

  onlyNumbersFrom1To100(event: KeyboardEvent, currentValue: string) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    const pattern = /^[0-9]$/;

    if (!pattern.test(event.key)) {
      event.preventDefault();
      return;
    }

    let newValue = currentValue;
    const cursorPosition = (event.target as HTMLInputElement).selectionStart;
    if (cursorPosition !== null) {
      newValue =
        currentValue.slice(0, cursorPosition) +
        event.key +
        currentValue.slice(cursorPosition);
    } else {
      newValue += event.key;
    }

    const numValue = parseInt(newValue, 10);
    if (numValue < 1 || numValue > 100 || newValue.length > 3) {
      event.preventDefault();
    }
  }

  onlyPositiveIntegers(event: KeyboardEvent, currentValue: string) {
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
      return;
    }

    const newValue = currentValue + event.key;
    const numValue = parseInt(newValue, 10);

    if (numValue === 0) {
      event.preventDefault();
    }
  }

  cargarTipoAmparos() {
    this.parametrosService
      .get<ParametroListResponse>(
        `parametro?query=TipoParametroId:${environment.AMPARO_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((Response: ParametroListResponse) => {
        if (Response.Status == '200') {
          this.amparos = Response.Data;
        }
      });
  }

  onSubmit() {
    if (this.form.valid) {
      this.guardarYContinuar();
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  sendDataToApi(data: AmparoPolizaDto[]) {
    this.polizasService.postAmparos(data).subscribe({
      next: (response: ApiResponse<any>) => {
        this.alertService.showSuccessAlert(
          `El amparo se ha enviado correctamente. IDs: ${response.Data.map(
            (obj: { id: any }) => obj.id
          ).join(', ')}`,
          'Amparo enviado correctamente'
        );
      },
      error: (error: any) => {
        this.alertService.showErrorAlert(
          'Ocurrió un error al enviar el amparo. Por favor, inténtelo de nuevo.',
          'Error al enviar amparo'
        );
      },
    });
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach((control) => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

  prepareFormData(): AmparoPolizaDto[] {
    return this.filasFormArray.controls.map((control) => {
      const formGroup = control as FormGroup;
      return {
        id: formGroup.get('id')?.value ?? null,
        amparo_id: formGroup.get('amparo')?.value,
        suficiencia: Number(
          formGroup.get('suficienciaSalarios')?.enabled
            ? formGroup.get('suficienciaSalarios')?.value
            : formGroup.get('suficienciaPorcentaje')?.value
        ),
        descripcion: formGroup.get('descripcion')?.value,
        contrato_general_id: this.contratoGeneral()?.id as number,
        tipo_valor_amparo_id: formGroup.get('suficienciaSalarios')?.enabled
          ? 1
          : 2,
      };
    });
  }

  getAmparosDisponibles(currentIndex: number): any[] {
    const amparosSeleccionados = this.filasFormArray.controls
      .map((control, index) =>
        index !== currentIndex ? control.get('amparo')?.value : null
      )
      .filter((value) => value !== null);
    return this.amparos.filter(
      (amparo: any) => !amparosSeleccionados.includes(amparo.Id)
    );
  }

  async onInView(inView: boolean) {
    if (inView) {
      //await this.loadSavedData();
    } else {
      console.log('Paso Garantías - out of view');
    }
  }
}
