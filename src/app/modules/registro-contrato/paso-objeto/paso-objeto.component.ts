import { Component } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-paso-objeto',
  templateUrl: './paso-objeto.component.html',
  styleUrls: ['./paso-objeto.component.css'],
})
export class PasoObjetoComponent {
  form = this._formBuilder.group({
    sixthCtrl: ['', Validators.required],
  });

  constructor(private _formBuilder: FormBuilder) { }
}