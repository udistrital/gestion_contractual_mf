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
import { ParametrosService } from 'src/app/services/parametros.service';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ApiResponse, ContratistaResponse, ContratoGeneral, DatosContratista, ParametroResponse, ProveedorObject } from 'src/app/types/types';
import { AlertService } from 'src/app/services/alert.service';


@Component({
    selector: 'app-paso-contratistas',
    templateUrl: './paso-contratistas.component.html',
    styleUrls: ['./paso-contratistas.component.css'],
    standalone: false
})
export class PasoContratistasComponent implements OnInit, OnDestroy {
  nextStep = output<void>();
  prevStep = output<void>();
  stepCompleted = output<boolean>();

  private contratistaId: number | null = null;
  contratoGeneral = input<ContratoGeneral>();
  contratistaPrevalidado = input<any>();
  bloquearContratista = input<boolean>(false);
  viewMode = input<boolean>(false);

  form: FormGroup;
  // Clases de contratista del parámetro tipo 120. Solo "Contratista Único" tiene flujo;
  // consorcio y unión temporal están sin definir.
  tiposContratista: ParametroResponse[] = [];
  claseContratistaUnicoId: number | null = null;
  errorClases = '';
  private clasesCargadas: Promise<void>;
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
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private parametrosService: ParametrosService
  ) {
    this.clasesCargadas = this.cargarClasesContratista();
    this.form = this.fb.group({
      claseContratista: [null as number | null, Validators.required],
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
        // null: aún no hay clase (Parámetros no ha respondido); disable() también lo emite.
        if (value == null) return;
        this.mostrarConsulta = this.esContratistaUnico(value);
        if (!this.mostrarConsulta) {
          this.form.get('documentoContratista')?.reset();
          this.resetContratista();
        }
      });
    this.aplicarModoVisualizacion();
  }

  private cargarClasesContratista(): Promise<void> {
    return this.parametrosService
      .getParametrosPorTipo([environment.CLASE_CONTRATISTA_ID])
      .then((parametros) => {
        this.tiposContratista = parametros?.[environment.CLASE_CONTRATISTA_ID] ?? [];
        // El Id de "Contratista Único" se toma por nombre: cambia entre ambientes.
        this.claseContratistaUnicoId =
          this.tiposContratista.find((clase) => normalizar(clase.Nombre) === 'contratista unico')?.Id ?? null;
      })
      .catch((error) => {
        console.error('Error al cargar las clases de contratista:', error);
        this.tiposContratista = [];
        this.claseContratistaUnicoId = null;
      })
      .then(() => {
        if (!this.claseContratistaUnicoId) {
          this.errorClases =
            'No se pudieron cargar las clases de contratista desde Parámetros. Intente más tarde o contacte al administrador.';
          return;
        }
        if (this.form.get('claseContratista')?.value == null) {
          this.form.patchValue({ claseContratista: this.claseContratistaUnicoId });
        }
      });
  }

  esContratistaUnico(claseId: number | null | undefined): boolean {
    return claseId != null && claseId === this.claseContratistaUnicoId;
  }

  /** En modo visualización el formulario queda en solo lectura. */
  private aplicarModoVisualizacion(): void {
    if (this.viewMode()) {
      this.mostrarConsulta = true;
      this.form.disable({ emitEvent: false });
    }
  }

  private aplicarContratistaPrevalidado(prevalidado: any): void {
    this.datosContratista = prevalidado;
    const doc =
      prevalidado.proveedor?.numero_documento ||
      prevalidado.proveedor?.num_documento ||
      prevalidado.numero_documento ||
      '';

    this.form.patchValue({ documentoContratista: doc });
    this.clasesCargadas.then(() => {
      if (this.claseContratistaUnicoId) {
        this.form.patchValue({ claseContratista: this.claseContratistaUnicoId });
      }
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
    if (this.esContratistaUnico(claseContratista) && documentoContratista) {
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

    // El contratista vive en contrato_general (modelo v2).
    this.contratoGeneralCrudService
      .get(contratoId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.cargandoContratista = false;
        })
      )
      .subscribe({
        next: async (response: any) => {
          await this.clasesCargadas;
          const documentoGuardado = response?.Data?.proveedor_numero_documento;
          // Los contratos anteriores al parámetro no tienen clase: eran todos de contratista único.
          const claseGuardada = response?.Data?.clase_proveedor_id ?? this.claseContratistaUnicoId;
          const contratista = documentoGuardado ? response.Data : null;
          const doc = documentoGuardado || docFallback;
          if (contratista) {
            this.contratistaId = contratoId;
          }
          if (claseGuardada) {
            this.form.patchValue({ claseContratista: claseGuardada });
          }
          if (doc) {
            this.form.patchValue({ documentoContratista: doc });
            this.buscarContratista();
          }
          this.aplicarModoVisualizacion();
          // En visualización no hay guardado: el estado del paso sale de los datos cargados.
          if (this.viewMode()) {
            this.mostrarConsulta = true;
            this.stepCompleted.emit(!!contratista);
          }
        },
        error: async (error) => {
          console.error('Error al cargar contratista:', error);
          await this.clasesCargadas;
          if (docFallback) {
            this.form.patchValue({ documentoContratista: docFallback });
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
    // Con el contratista bloqueado el control está deshabilitado y no cuenta en la validez.
    const claseProveedorId = this.form.getRawValue().claseContratista;
    if (!claseProveedorId) {
      this.alertService.showErrorAlert(this.errorClases || 'Seleccione la clase de contratista.');
      return;
    }

    // El contratista se guarda en contrato_general (PUT parcial).
    const request$ = this.contratoGeneralCrudService.put(
      this.contratoGeneral()?.id!,
      {
        proveedor_numero_documento: String(doc),
        tipo_persona_id: Number(tipoPersonaId),
        clase_proveedor_id: Number(claseProveedorId),
      }
    );

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

/** Minúsculas y sin tildes, para comparar nombres de Parámetros. */
function normalizar(texto: string | undefined): string {
  return (texto ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}
