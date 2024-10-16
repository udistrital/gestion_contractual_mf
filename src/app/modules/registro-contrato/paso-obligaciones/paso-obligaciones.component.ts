import {Component, EventEmitter, Output} from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'app-paso-obligaciones',
  templateUrl: './paso-obligaciones.component.html',
  styleUrls: ['./paso-obligaciones.component.css'],
})
export class PasoObligacionesComponent {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

  form = this._formBuilder.group({
    sixthCtrl: ['', Validators.required],
  });

  constructor(private _formBuilder: FormBuilder) { }

  onInView(inView: boolean) {
    if (inView) {
      console.log('Step Obligaciones in view');
    } else {
      console.log('Step Obligaciones out of view');
    }
  }
}
