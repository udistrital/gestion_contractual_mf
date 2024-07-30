import {Component, OnInit, OnDestroy, ViewChild} from '@angular/core';
import {FormBuilder, Validators, FormGroup, ValidationErrors, AbstractControl} from '@angular/forms';
import { ProveedoresService } from "../../../services/proveedores.service";
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import {MatStepper} from "@angular/material/stepper";

export interface Proveedor {
  id_proveedor: string;
  ciudad_expedicion_documento: string;
  id_ciudad_contacto: string;
  direccion: string;
  numero_documento: string;
  nombre_estado: string;
  numero_cuenta_bancaria: string;
  id_estado: string;
  nombre_completo_proveedor: string;
  ciudad_contacto: string;
  web: string;
  fecha_registro: string;
  correo: string;
  id_entidad_bancaria: string;
  tipo_persona: string;
  tipo_cuenta_bancaria: string;
  fecha_ultima_modificacion: string;
}

export interface Representante {
  segundo_apellido: string;
  tipo_documento: string;
  ciudad_expedicion_documento: string;
  genero: string;
  numero_documento: string;
  primer_apellido: string;
  segundo_nombre: string;
  digito_verificacion: string;
  id_tipo_documento: string;
  id_ciudad_expedicion_documento: string;
  primer_nombre: string;
  id_proveedor_juridico: string;
}

export interface DatosContratista {
  proveedor: Proveedor;
  representante?: Representante;
}

interface ProveedorObject{
  tipo: string;
  nombre: string;
  documento: string;
  ciudad_contacto: string;
  direccion: string;
  correo: string;
  lugar_expedicion?: string;
  representante_legal?: string;
  documento_rl?: string;
  lugar_expedicion_rl?: string;
}

@Component({
  selector: 'app-paso-contratistas',
  templateUrl: './paso-contratistas.component.html',
  styleUrls: ['./paso-contratistas.component.css'],
})
export class PasoContratistasComponent implements OnInit, OnDestroy {

  form: FormGroup;
  tiposContratista = [
    { value: 'clase1', viewValue: 'Contratista Único' },
    { value: 'clase2', viewValue: 'Clase 2' }
  ];
  datosContratista: DatosContratista | null = null;

  contratistaObject: ProveedorObject = {
    tipo: '',
    nombre: '',
    documento: '',
    ciudad_contacto: '',
    direccion: '',
    correo: '',
  };

  mostrarConsulta = false;
  errorMessage = '';
  success = false;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService
  ) {
    this.form = this.fb.group({
      claseContratista: ['', Validators.required],
      documentoContratista: ['', [Validators.required, Validators.minLength(5)]],
      contratistaData: ['', [this.contratistaValidator()]]
    });
  }

  ngOnInit() {
    this.form.get('claseContratista')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.mostrarConsulta = value === 'clase1';
      if (!this.mostrarConsulta) {
        this.form.get('documentoContratista')?.reset();
        this.resetContratista();
      }
    });

    this.form.get('contratistaData')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.form.get('contratistaData')?.updateValueAndValidity();
    });

  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscarContratista() {
    const { claseContratista, documentoContratista } = this.form.value;
    if (claseContratista === 'clase1' && documentoContratista) {
      this.loading = true;
      this.errorMessage = '';
      this.success = false;

      this.proveedoresService.get(`contratista?id=${documentoContratista}`).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
          next: (response: any) => {
            this.loading = false;
            if (response.Status === 200) {
              this.datosContratista = response.Data;
              this.actualizarObjetoContratista();
              this.success = true;
              this.form.get('contratistaData')?.setValue(this.contratistaObject);
            } else {
              this.errorMessage = response.Message;
              this.resetContratista();
            }
          },
          error: () => {
            this.loading = false;
            this.errorMessage = 'Error al buscar el contratista. Por favor, intente de nuevo.';
            this.resetContratista();
          }
        }
      );
    }
  }

  private actualizarObjetoContratista() {
    if (this.datosContratista) {
      if(this.datosContratista.proveedor.tipo_persona === 'JURIDICA'){
        this.contratistaObject = {
          tipo: 'Jurídica',
          nombre: this.datosContratista.proveedor.nombre_completo_proveedor,
          documento: this.datosContratista.proveedor.numero_documento,
          ciudad_contacto: this.datosContratista.proveedor.ciudad_contacto,
          direccion: this.datosContratista.proveedor.direccion,
          correo: this.datosContratista.proveedor.correo,
          representante_legal: this.datosContratista.representante?.primer_nombre || '' + this.datosContratista.representante?.segundo_nombre || '' + this.datosContratista.representante?.primer_apellido || '' + this.datosContratista.representante?.segundo_apellido || '',
          documento_rl: this.datosContratista.representante?.numero_documento || '',
          lugar_expedicion_rl: this.datosContratista.representante?.ciudad_expedicion_documento || ''
        }
      } if (this.datosContratista.proveedor.tipo_persona === 'NATURAL') {
        this.contratistaObject = {
          tipo: 'Natural',
          nombre: this.datosContratista.proveedor.nombre_completo_proveedor,
          documento: this.datosContratista.proveedor.numero_documento,
          lugar_expedicion: this.datosContratista.proveedor.ciudad_expedicion_documento,
          ciudad_contacto: this.datosContratista.proveedor.ciudad_contacto,
          direccion: this.datosContratista.proveedor.direccion,
          correo: this.datosContratista.proveedor.correo,
        }
      }
    }
  }

  private resetContratista() {
    this.datosContratista = null;
    this.contratistaObject = {
      correo: "",
      tipo: '',
      nombre: '',
      documento: '',
      ciudad_contacto: '',
      direccion: ''
    };
    this.success = false;
  }

  private contratistaValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const contratistaObject = control.value as ProveedorObject;
      if (!contratistaObject || Object.values(contratistaObject).every(val => val === '')) {
        return { emptyContratista: true };
      }
      return null;
    };
  }

  resetComponent() {
    this.form.reset();
    this.resetContratista();
    this.mostrarConsulta = false;
    this.errorMessage = '';
    this.success = false;
    this.loading = false;
  }

  onStepLeave() {
    this.resetComponent();
  }
}
