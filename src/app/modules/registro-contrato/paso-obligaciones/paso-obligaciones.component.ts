import { Component } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-paso-obligaciones',
  templateUrl: './paso-obligaciones.component.html',
  styleUrls: ['./paso-obligaciones.component.css'],
})
export class PasoObligacionesComponent {
  form = this._formBuilder.group({
    sixthCtrl: ['', Validators.required],
  });

  constructor(private _formBuilder: FormBuilder) { }
}