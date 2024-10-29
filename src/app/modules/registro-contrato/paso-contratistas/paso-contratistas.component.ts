import { Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter, ENVIRONMENT_INITIALIZER } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ValidationErrors, AbstractControl } from '@angular/forms';
import { ProveedoresService } from "../../../services/proveedores.service";
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';

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
  contratos: Contrato[];
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
  contratos: Contrato[];
}

interface ProveedorObject {
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
  contratos?: Contrato[];
  ultimoContrato?: {
    tipo: string;
    estado: string;
    numero: string;
    vigencia: string;
  };
}

interface TipoContrato {
  id: string;
  nombre: string;
}

interface EstadoContrato {
  id: string;
  nombre: string;
}

interface Contrato {
  tipo_contrato: TipoContrato;
  estado_contrato: EstadoContrato;
}

@Component({
  selector: 'app-paso-contratistas',
  templateUrl: './paso-contratistas.component.html',
  styleUrls: ['./paso-contratistas.component.css'],
})
export class PasoContratistasComponent implements OnInit, OnDestroy {
  @Output() nextStep = new EventEmitter<void>();
  @Output() stepCompleted = new EventEmitter<boolean>();

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
    contratos: [],
    ultimoContrato: undefined
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

      this.proveedoresService.get(`contratistas?id=${documentoContratista}`).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.Status === 200) {
            this.datosContratista = response.Data;
            this.actualizarObjetoContratista();
            if (this.success) {
              this.form.get('contratistaData')?.setValue(this.contratistaObject);
            }
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
      });
    }
  }

  private actualizarObjetoContratista(): void {
    if (!this.datosContratista) return;

    const { proveedor, representante } = this.datosContratista;
    const contratos = (this.datosContratista as any).contratos;
    const tipoPersona = proveedor.tipo_persona;

    let contratosOrdenados: any[] = [];
    if (Array.isArray(contratos) && contratos.length > 0) {
      contratosOrdenados = [...contratos].sort((a, b) => {
        if (a.vigencia === b.vigencia) {
          return parseInt(b.numero_contrato) - parseInt(a.numero_contrato);
        }
        return parseInt(b.vigencia) - parseInt(a.vigencia);
      });
    }

    if (tipoPersona === 'NATURAL' && contratosOrdenados.length > 0) {
      const ultimoContrato = contratosOrdenados[0];
      const estadoContrato = ultimoContrato.estado_contrato.nombre.toUpperCase();
      const tipoContrato = ultimoContrato.tipo_contrato.nombre;

      if (estadoContrato === environment.ESTADO_CONTRATO_ENEJECUCION) {
        Swal.fire({
          icon: 'error',
          title: '¡¡ERROR!!',
          text: `El contratista seleccionado tiene un ${tipoContrato} en estado "${estadoContrato}" en el sistema`,
        });
        this.resetContratista();
        this.success = false;
        return;
      }
    }

    const datosComunes = {
      nombre: proveedor.nombre_completo_proveedor,
      documento: proveedor.numero_documento,
      ciudad_contacto: proveedor.ciudad_contacto,
      direccion: proveedor.direccion,
      correo: proveedor.correo,
    };

    if (tipoPersona === 'JURIDICA') {
      this.contratistaObject = {
        ...datosComunes,
        tipo: 'Jurídica',
        representante_legal: this.obtenerNombreCompleto(representante),
        documento_rl: representante?.numero_documento || '',
        lugar_expedicion_rl: representante?.ciudad_expedicion_documento || '',
      };
    } else if (tipoPersona === 'NATURAL') {
      this.contratistaObject = {
        ...datosComunes,
        tipo: 'Natural',
        lugar_expedicion: proveedor.ciudad_expedicion_documento,
        contratos: contratos || [],
      };

      if (contratosOrdenados.length > 0) {
        const ultimoContrato = contratosOrdenados[0];
        const estadoContrato = ultimoContrato.estado_contrato.nombre.toUpperCase();
        const tipoContrato = ultimoContrato.tipo_contrato.nombre;
        const estadosPermitidos = [
          environment.ESTADO_CONTRATO_SUSCRITO,
          environment.ESTADO_CONTRATO_PORSUSCRIBIR,
          environment.ESTADO_CONTRATO_LEGALIZADO
        ];

        if (estadosPermitidos.includes(estadoContrato)) {
          const mensajeContrato = `${tipoContrato} en estado "${estadoContrato}"`;
          Swal.fire({
            icon: 'warning',
            title: `El contratista seleccionado tiene un ${mensajeContrato} en el sistema`,
            text: 'Por favor verifique la información antes de continuar con el registro',
          });
        }
      }
    }

    this.success = true;
  }

  private obtenerNombreCompleto(persona: any): string {
    if (!persona) return '';

    return [
      persona.primer_nombre,
      persona.segundo_nombre,
      persona.primer_apellido,
      persona.segundo_apellido
    ].filter(Boolean).join(' ');
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
