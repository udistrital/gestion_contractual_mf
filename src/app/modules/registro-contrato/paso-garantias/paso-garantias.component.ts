import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';

interface Fila {
  amparo: string;
  suficiencia: string;
  descripcion: string;
}

@Component({
  selector: 'app-paso-garantias',
  templateUrl: './paso-garantias.component.html',
  styleUrls: ['./paso-garantias.component.css'],
})
export class PasoGarantiasComponent implements OnInit {
  form: FormGroup;

  amparos: any[] = [];

  displayedColumns = ['id', 'amparo', 'suficiencia', 'descripcion', 'acciones'];
  dataSource: Fila[] = [];

  constructor(private _formBuilder: FormBuilder, private parametrosService: ParametrosService, private cdRef: ChangeDetectorRef) {
    this.form = this._formBuilder.group({
      filas: this._formBuilder.array([])
    });
  }

  ngOnInit() {
    this.agregarFila();
    this.CargarAmparos();
  }

  get filasFormArray(): FormArray {
    return this.form.get('filas') as FormArray;
  }

  crearFilaFormGroup(): FormGroup {
    return this._formBuilder.group({
      amparo: ['', Validators.required],
      suficiencia: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  agregarFila() {
    this.filasFormArray.push(this.crearFilaFormGroup());
    this.actualizarDataSource();
  }

  eliminarFila(index: number) {
    this.filasFormArray.removeAt(index);
    this.actualizarDataSource();
  }

  actualizarDataSource() {
    this.dataSource = this.filasFormArray.controls.map(control => control.value);
  }

  CargarAmparos() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.AMPARO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.amparos = Response.Data;
      }
    })
  }

}