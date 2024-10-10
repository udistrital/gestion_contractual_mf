import {ChangeDetectorRef, Component, EventEmitter, Output} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UbicacionService } from 'src/app/services/ubicacion.service';

@Component({
  selector: 'app-paso-supervisores',
  templateUrl: './paso-supervisores.component.html',
  styleUrls: ['./paso-supervisores.component.css'],
})

export class PasoSupervisoresComponent {
  @Output() nextStep = new EventEmitter<void>();

  constructor(
    private _formBuilder: FormBuilder,
    private ubicacionService: UbicacionService,
    private cdRef: ChangeDetectorRef
  ) { }

  form = this._formBuilder.group({
    dependencia: ['', Validators.required],
    sede: ['', Validators.required],
    supervisor: ['', Validators.required],
    cargo: ['', Validators.required],
    tipoControl: ['', Validators.required],
    codigoVerificacion: ['', Validators.required],
    pais: ['', Validators.required],
    departamento: ['', Validators.required],
    municipioCiudad: ['', Validators.required],
    direccion: ['', Validators.required]
  });

  supervisores: any[] = [{
    dependencia: '',
    sede: '',
    nombre: '',
    cargo: '',
    tipoControl: '',
    codigoVerificacion: ''
  }];

  pais: any[] = [];
  departamento: any[] = [];
  municipioCiudad: any[] = [];

  ngOnInit(): void {
    this.CargarPais();

    this.form.get('pais')?.valueChanges.subscribe((id_pais) => {
      if (id_pais) {
        this.CargarDepartamento(id_pais);
      }
    });

    this.form.get('departamento')?.valueChanges.subscribe((id_departamento) => {
      if (id_departamento) {
        this.CargarCiudad(id_departamento);
      }
    });

  }

  CargarPais() {
    this.ubicacionService.get('lugar?query=TipoLugarId:1&limit=0').subscribe((Response: any) => {
      if (Response.length != 0) {
        this.pais = Response;
      }
    })
  }

  CargarDepartamento(id_pais: string) {
    this.ubicacionService.get('relacion_lugares?query=LugarPadreId:' + id_pais + '&limit=0').subscribe((Response: any) => {
      if (Response.length != 0) {
        this.departamento = Response;
      }
    })
  }

  CargarCiudad(id_departamento: string) {
    this.ubicacionService.get('relacion_lugares?query=LugarPadreId:' + id_departamento + '&limit=0').subscribe((Response: any) => {
      if (Response.length != 0) {
        this.municipioCiudad = Response;
      }
    })
  }

  agregarSupervisor() {
    this.supervisores.push({
      dependencia: '',
      sede: '',
      nombre: '',
      cargo: '',
      tipoControl: '',
      codigoVerificacion: ''
    });
  }

  eliminarSupervisor(index: number) {
    if (this.supervisores.length > 1) {
      this.supervisores.splice(index, 1);
    } else {
      // Opcional: mostrar un mensaje si intentan eliminar el último supervisor
      console.log('No se puede eliminar el último supervisor');
    }
  }

}
