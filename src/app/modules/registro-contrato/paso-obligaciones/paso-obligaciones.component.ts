import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

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
export class PasoObligacionesComponent implements OnInit {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  form = this._formBuilder.group({
    sixthCtrl: ['', Validators.required],
  });

  cdpData: CDP[] = [];

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.loadCDPData();
  }

  loadCDPData() {
    const cdpString = localStorage.getItem('cdp');
    if (cdpString) {
      this.cdpData = JSON.parse(cdpString);
    }
  }

  onInView(inView: boolean) {
    if (inView) {
      console.log('Step Obligaciones in view');
    } else {
      console.log('Step Obligaciones out of view');
    }
  }
}
