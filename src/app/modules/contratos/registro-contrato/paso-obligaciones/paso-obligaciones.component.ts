import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdpsService } from "src/app/services/cdps.service";
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';
import { Subscription } from "rxjs";
import { ContratoGeneral } from 'src/app/types/types';

interface CDP {
  vigencia: string;
  descripcion: string;
  rubro_interno: string;
  estado: string;
  justificacion: string;
  id_sol_cdp: string;
  nombre_dependencia: string;
  fecha_registro: string;
  observaciones: string;
  numero_disponibilidad: string;
  num_sol_adq: string;
  valor_contratacion: string;
  estadocdp: string;
}

@Component({
    selector: 'app-paso-obligaciones',
    templateUrl: './paso-obligaciones.component.html',
    styleUrls: ['./paso-obligaciones.component.css'],
    standalone: false
})
export class PasoObligacionesComponent implements OnInit, OnDestroy {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  form: FormGroup;
  cdpData: CDP[] = [];
  private cdpSubscription: Subscription = new Subscription();
  private previousCDPCount: number = 0;
  contratoGeneralId: number | null = null;

  constructor(
    private _formBuilder: FormBuilder,
    private cdpService: CdpsService,
    private contratoService: ContratoGeneralCrudService,
    private alertService: AlertService
  ) {
    this.form = this._formBuilder.group({
      justificacion: ['', Validators.required],
      objetoContrato: ['', Validators.required],
      actividades: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadContratoData();
    this.loadCDPData();
    this.cdpSubscription = this.cdpService.cdp$.subscribe(data => {
      this.cdpData = data;
      this.updateFormWithCDPData();
    });
  }

  ngOnDestroy() {
    if (this.cdpSubscription) {
      this.cdpSubscription.unsubscribe();
    }
  }

  loadContratoData() {
    const contratoGeneral = localStorage.getItem('paso-info-general');
    if (contratoGeneral) {
      const parsedContrato: ContratoGeneral = JSON.parse(contratoGeneral);
      this.contratoGeneralId = parsedContrato.id;
    }

  }

  loadCDPData() {
    this.cdpData = this.cdpService.getLocalCDP();
    this.updateFormWithCDPData();
  }

  updateFormWithCDPData() {
    const currentCDPCount = this.cdpData.length;

    if (currentCDPCount === 1) {
      const cdp = this.cdpData[0];
      this.form.patchValue({
        justificacion: cdp.justificacion || '',
        objetoContrato: cdp.descripcion || '',
        actividades: cdp.observaciones || ''
      });
    } else if (currentCDPCount >= 2 || currentCDPCount === 0) {
      // Reiniciar los editores si hay 2 o más CDPs, o si el arreglo está vacío
      this.resetForm();
      const savedData = localStorage.getItem('paso-obligaciones');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        this.form.patchValue({
          justificacion: parsedData.justificacion || '',
          objetoContrato: parsedData.objeto || '',
          actividades: parsedData.actividades || ''
        });
      }
    }

    this.previousCDPCount = currentCDPCount;
  }

  resetForm() {
    this.form.patchValue({
      justificacion: '',
      objetoContrato: '',
      actividades: ''
    });
  }

  onInView(inView: boolean) {
    if (inView) {
      console.log('Step Obligaciones in view');
      this.loadCDPData();
    } else {
      console.log('Step Obligaciones out of view');
    }
  }

  get hasSingleCDP(): boolean {
    return this.cdpData.length === 1;
  }

  guardarObligaciones() {
    if (this.form.valid && this.contratoGeneralId) {
      const obligacionesData = {
        justificacion: this.form.get('justificacion')?.value,
        objeto: this.form.get('objetoContrato')?.value,
        actividades: this.form.get('actividades')?.value
      };
      this.contratoService.put(this.contratoGeneralId, obligacionesData).subscribe({
        next: (response) => {
          if (response.Success) {
            localStorage.setItem('paso-obligaciones', JSON.stringify(obligacionesData));
            this.alertService.showSuccessAlert('Obligaciones guardadas exitosamente.');
            this.stepCompleted.emit(true);
            this.nextStep.emit();
          }
        }
      });
    } else {
      this.alertService.showErrorAlert('Por favor, complete todos los campos requeridos antes de guardar.');
    }
  }
}
