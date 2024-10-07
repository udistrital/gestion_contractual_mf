import {ChangeDetectorRef, Component, EventEmitter, OnInit, Output} from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatTableDataSource } from '@angular/material/table';
import { PolizasService} from 'src/app/services/polizas.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import {Amparo, ApiResponse} from "../../../services/polizas.interfaces";
import Swal from "sweetalert2";

@Component({
  selector: 'app-paso-garantias',
  templateUrl: './paso-garantias.component.html',
  styleUrls: ['./paso-garantias.component.css'],
})
export class PasoGarantiasComponent implements OnInit {
  @Output() nextStep = new EventEmitter<void>();

  form: FormGroup;
  amparos: any[] = [];
  displayedColumns = ['id', 'amparo', 'suficiencia', 'descripcion', 'acciones'];
  dataSource: MatTableDataSource<FormGroup>;
  contratoGeneralId = '1234'; //ID Mock para pruebas

  constructor(
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private polizasService: PolizasService,
    private cdRef: ChangeDetectorRef
  ) {
    this.form = this._formBuilder.group({
      filas: this._formBuilder.array([])
    });
    this.dataSource = new MatTableDataSource<FormGroup>([]);
  }

  ngOnInit() {
    this.agregarFila();
    this.cargarTipoAmparos();
  }

  get filasFormArray(): FormArray {
    return this.form.get('filas') as FormArray;
  }

  crearFilaFormGroup(): FormGroup {
    return this._formBuilder.group({
      amparo: ['', Validators.required],
      suficienciaPorcentaje: ['', Validators.required],
      suficienciaSalarios: [{ value: '', disabled: true }],
      descripcion: ['', Validators.required]
    });
  }

  agregarFila() {
    const nuevaFila = this.crearFilaFormGroup();
    this.filasFormArray.push(nuevaFila);
    this.configurarAmparoListener(nuevaFila);
    this.actualizarDataSource();
  }

  eliminarFila(index: number) {
    this.filasFormArray.removeAt(index);
    this.actualizarDataSource();
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

        const suficienciaPorcentajeControl = filaFormGroup.get('suficienciaPorcentaje');
        const suficienciaSalariosControl = filaFormGroup.get('suficienciaSalarios');

        if (idAmparoStr === tipoAmparoIdStr) {
          suficienciaPorcentajeControl?.disable();
          suficienciaPorcentajeControl?.setValue('');
          suficienciaSalariosControl?.enable();
          suficienciaSalariosControl?.setValidators(Validators.required);
        } else {
          suficienciaPorcentajeControl?.enable();
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
      'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'
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
      newValue = currentValue.slice(0, cursorPosition) + event.key + currentValue.slice(cursorPosition);
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
      'Backspace', 'Tab', 'End', 'Home', 'ArrowLeft', 'ArrowRight', 'Delete'
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
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.AMPARO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.amparos = Response.Data;
      }
    })
  }

  onSubmit() {
    if (this.form.valid) {
      const formData = this.prepareFormData();
      this.sendDataToApi(formData);
    } else {
      this.markFormGroupTouched(this.form);
    }
  }

  prepareFormData() {
    return this.filasFormArray.controls.map(control => {
      const formGroup = control as FormGroup;
      if (formGroup.get('suficienciaSalarios')?.enabled) {
        return {
          amparo_id: formGroup.get('amparo')?.value,
          suficiencia: formGroup.get('suficienciaSalarios')?.value,
          descripcion: formGroup.get('descripcion')?.value,
          contrato_general_id: this.contratoGeneralId,
          tipo_valor_amparo_id: 1 //ID Mock para pruebas
        };
      } else {
        return {
          amparo_id: formGroup.get('amparo')?.value,
          suficiencia: formGroup.get('suficienciaPorcentaje')?.value,
          descripcion: formGroup.get('descripcion')?.value,
          contrato_general_id: this.contratoGeneralId,
          tipo_valor_amparo_id: 2 //ID Mock para pruebas
        };
      }

    });
  }

  sendDataToApi(data: Amparo[]) {
    this.polizasService.post(data).subscribe({
      next: (response: ApiResponse<any>) => {
        console.log('Amparo enviado correctamente', response);
        Swal.fire({
          icon: 'success',
          title: 'Amparo enviado correctamente',
          text: `El amparo se ha enviado correctamente. IDs: ${response.Data.map((obj: { id: any; }) => obj.id).join(', ')}`,
        });
      },
      error: (error: any) => {
        console.error('Error al enviar amparo', error);
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar amparo',
          text: 'Ocurrió un error al enviar el amparo. Por favor, inténtelo de nuevo.',
        });
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup | FormArray) {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

}
