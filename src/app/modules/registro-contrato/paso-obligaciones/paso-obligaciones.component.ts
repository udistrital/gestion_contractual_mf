import { Component, EventEmitter, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdpsService } from "../../../services/cdps.service";
import { Subscription } from "rxjs";

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
})
export class PasoObligacionesComponent implements OnInit, OnDestroy {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  form: FormGroup;
  cdpData: CDP[] = [];
  private cdpSubscription: Subscription = new Subscription();
  private previousCDPCount: number = 0;

  constructor(
    private _formBuilder: FormBuilder,
    private cdpService: CdpsService
  ) {
    this.form = this._formBuilder.group({
      justificacion: ['', Validators.required],
      objetoContrato: ['', Validators.required],
      actividades: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadCDPData();
    this.cdpSubscription = this.cdpService.cdp$.subscribe(data => {
      this.cdpData = data;
      this.updateFormWithCDPData();
      console.log('CDP data updated:', this.cdpData);
    });
  }

  ngOnDestroy() {
    if (this.cdpSubscription) {
      this.cdpSubscription.unsubscribe();
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
}
