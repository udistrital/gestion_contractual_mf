import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";


@Component({
    selector: 'app-detalle-contrato',
    templateUrl: './detalle-contrato.component.html',
    styleUrl: './detalle-contrato.component.css',
    standalone: false,
})
export class DetalleContratoComponent {

  formGroups: FormGroup[];

  constructor(private _formBuilder: FormBuilder) {
    this.formGroups = Array(9).fill(null).map(() => this._formBuilder.group({}));
  }

  ngOnInit() {
    this.formGroups = this.formGroups.map((_, index) => this._formBuilder.group({
      [`paso${index + 1}Ctrl`]: ['', Validators.required],
    }));
  }


}
