import {
  Component,
  OnInit,
  OnChanges,
  OnDestroy,
  Output,
  EventEmitter,
  input,
  effect,
  output,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
  FormGroup,
  ValidationErrors,
  AbstractControl,
} from '@angular/forms';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResponse, ContratistaCRUD, ContratistaResponse, ContratoGeneral, DatosContratista, ProveedorObject } from 'src/app/types/types';
import { AlertService } from 'src/app/services/alert.service';


@Component({
    selector: 'app-paso-contratistas',
    templateUrl: './paso-contratistas.component.html',
    styleUrls: ['./paso-contratistas.component.css'],
    standalone: false
})
export class PasoContratistasComponent implements OnInit, OnDestroy, OnChanges {
  nextStep = output<void>();
  stepCompleted = output<boolean>();

  private contratistaId: string | null = null;
  contratoGeneral = input<ContratoGeneral>();
  contratistaPrevalidado = input<any>();
  bloquearContratista = input<boolean>(false);

  form: FormGroup;
  tiposContratista = [{ value: 'clase1', viewValue: 'Contratista Único' }];
  datosContratista: DatosContratista | null = null;

  contratistaObject: ProveedorObject = {
    tipo: '',
    nombre: '',
    documento: '',
    ciudad_contacto: '',
    direccion: '',
    correo: '',
    contratos: [],
    ultimoContrato: undefined,
  };

  mostrarConsulta = false;
  errorMessage = '';
  private contratoCargadoId: number = 0;
  private cargandoContratista: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private alertService: AlertService,
    private fb: FormBuilder,
    private proveedoresService: ProveedoresService,
    private contratoGeneralCrudService: ContratoGeneralCrudService
  ) {
    this.form = this.fb.group({
      claseContratista: ['clase1', Validators.required],
      documentoContratista: [
        '',
        [Validators.required, Validators.minLength(5)],
      ],
      contratistaData: ['', [this.contratistaValidator()]],
    });

    effect(() => {
      if (this.contratoGeneral()) {
        this.cargarContratistaExistente();
      }
    });

    effect(() => {
      const prevalidado = this.contratistaPrevalidado();
      if (prevalidado) {
        this.aplicarContratistaPrevalidado(prevalidado);
      }
    });
  }

  ngOnInit() {
    if (this.contratistaPrevalidado()) {
      this.aplicarContratistaPrevalidado(this.contratistaPrevalidado());
    }
    if (this.contratoGeneral()?.id) {
      this.cargarContratistaExistente();
    }

    this.form
      .get('claseContratista')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((value) => {
        this.mostrarConsulta = value === 'clase1';
        if (!this.mostrarConsulta) {
          this.form.get('documentoContratista')?.reset();
          this.resetContratista();
        }
      });
  }

  ngOnChanges(): void {
    if (this.contratoGeneral()?.id) {
      this.cargarContratistaExistente();
    }
  }

  private aplicarContratistaPrevalidado(prevalidado: any): void {
    this.datosContratista = prevalidado;
    const doc =
      prevalidado.proveedor?.numero_documento ||
      prevalidado.proveedor?.num_documento ||
      prevalidado.numero_documento ||
      '';

    this.form.patchValue({
      claseContratista: 'clase1',
      documentoContratista: doc,
    });
    this.mostrarConsulta = true;
    this.actualizarObjetoContratista();
    this.form.get('contratistaData')?.setValue(this.contratistaObject);

    if (this.bloquearContratista()) {
      this.form.get('documentoContratista')?.disable();
      this.form.get('claseContratista')?.disable();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  buscarContratista() {
    const { claseContratista, documentoContratista } = this.form.value;
    if (claseContratista === 'clase1' && documentoContratista) {
      this.errorMessage = '';

      this.proveedoresService
        .get(`contratistas?id=${documentoContratista}`)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            if (response.Status === 200) {
              this.datosContratista = response.Data;
              this.actualizarObjetoContratista();
              this.form
                .get('contratistaData')
                ?.setValue(this.contratistaObject);
            } else {
              this.errorMessage = response.Message;
              this.resetContratista();
            }
          },
          error: () => {
            this.errorMessage =
              'Error al buscar el contratista. Por favor, intente de nuevo.';
            this.resetContratista();
          },
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
      const estadoContrato =
        ultimoContrato.estado_contrato.nombre.toUpperCase();
      const tipoContrato = ultimoContrato.tipo_contrato.nombre;

      if (estadoContrato === environment.ESTADO_CONTRATO_ENEJECUCION) {
        this.alertService.showErrorAlert(
          `El contratista seleccionado tiene un ${tipoContrato} en estado "${estadoContrato}" en el sistema`
        );
        this.resetContratista();
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
        const estadoContrato =
          ultimoContrato.estado_contrato.nombre.toUpperCase();
        const tipoContrato = ultimoContrato.tipo_contrato.nombre;
        const estadosPermitidos = [
          environment.ESTADO_CONTRATO_SUSCRITO,
          environment.ESTADO_CONTRATO_PORSUSCRIBIR,
          environment.ESTADO_CONTRATO_LEGALIZADO,
        ];

        if (estadosPermitidos.includes(estadoContrato)) {
          const mensajeContrato = `${tipoContrato} en estado "${estadoContrato}"`;
          this.alertService.showAlert(
            'Por favor verifique la información antes de continuar con el registro',
            `El contratista seleccionado tiene un ${mensajeContrato} en el sistema`
          );
        }
      }
    }
  }

  private obtenerNombreCompleto(persona: any): string {
    if (!persona) return '';

    return [
      persona.primer_nombre,
      persona.segundo_nombre,
      persona.primer_apellido,
      persona.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private resetContratista() {
    this.datosContratista = null;
    this.contratistaObject = {
      correo: '',
      tipo: '',
      nombre: '',
      documento: '',
      ciudad_contacto: '',
      direccion: '',
    };
  }

  private contratistaValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      const contratistaObject = control.value as ProveedorObject;
      if (
        !contratistaObject ||
        Object.values(contratistaObject).every((val) => val === '')
      ) {
        return { emptyContratista: true };
      }
      return null;
    };
  }



  private async cargarContratistaExistente() {
    const contratoId = this.contratoGeneral()?.id;
    if (!contratoId || this.contratoCargadoId === contratoId || this.cargandoContratista) return;

    this.contratoCargadoId = contratoId;
    this.cargandoContratista = true;

    const docFallback =
      this.contratoGeneral()?.contratista?.numero_documento ||
      (this.contratoGeneral() as any)?.contratista?.num_documento ||
      (this.contratoGeneral() as any)?.contratista?.identificacion ||
      (this.contratoGeneral() as any)?.numero_documento;

    this.contratoGeneralCrudService
      .getContratista(contratoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoContratista = false;
        })
      )
      .subscribe({
        next: (response: any) => {
          const contratista =
            response?.Data || (response?.numero_documento ? response : null);
          const doc = contratista?.numero_documento || docFallback;
          if (contratista?.id) {
            this.contratistaId = contratista.id;
          }
          if (doc) {
            this.form.patchValue({
              claseContratista: 'clase1',
              documentoContratista: doc,
            });
            this.buscarContratista();
          }
        },
        error: (error) => {
          console.error('Error al cargar contratista:', error);
          if (docFallback) {
            this.form.patchValue({
              claseContratista: 'clase1',
              documentoContratista: docFallback,
            });
            this.buscarContratista();
          }
        },
      });
  }

  guardarYContinuar(): void {
    if (!this.form.valid || !this.datosContratista) {
      return;
    }

    const doc =
      this.datosContratista.proveedor?.numero_documento ||
      (this.datosContratista.proveedor as any)?.num_documento ||
      (this.datosContratista as any).numero_documento ||
      this.form.getRawValue().documentoContratista;
    const tipoPersonaId =
      this.datosContratista.proveedor?.tipo_persona_id ||
      (this.datosContratista as any).tipo_persona_id ||
      1;

    const datosContratista: ContratistaCRUD = {
      numero_documento: doc,
      tipo_persona_id: tipoPersonaId,
      contrato_general_id: this.contratoGeneral()?.id!,
    };

    if (this.contratistaId) {
      datosContratista.id = this.contratistaId;
    }

    const request$ = this.contratistaId
      ? this.contratoGeneralCrudService.putContratista(datosContratista)
      : this.contratoGeneralCrudService.postContratista(datosContratista);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (response: any) => {
        if (response.Success) {
          this.alertService.showSuccessAlert(
            `El contratista ha sido ${this.contratistaId ? 'actualizado' : 'guardado'} correctamente`,
            '¡Exito!'
          ).then(() => {
            this.nextStep.emit();
          });
        } else {
          this.alertService.showErrorAlert(
            response.Message ||
              `No se pudo ${
                this.contratistaId ? 'actualizar' : 'completar el registro del'
              } contratista`
          );
        }
      },
      error: (error) => {
        console.error(
          `Error al ${
            this.contratistaId ? 'actualizar' : 'guardar'
          } contratista:`,
          error
        );
        this.alertService.showErrorAlert(
          error.Message ||
            `Ha ocurrido un error al ${
              this.contratistaId ? 'actualizar' : 'guardar'
            } el contratista. Por favor, intente nuevamente.`
        );
      },
    });
  }

}
