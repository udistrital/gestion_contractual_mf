import {
  ChangeDetectorRef,
  Component,
  input,
  OnDestroy,
  OnInit,
  output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize, firstValueFrom, Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged } from 'rxjs/operators';
import { CdpsService } from 'src/app/services/cdps.service';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ApiResponse, CDP, CDPContratoCRUD, CDPData, CDPItem, ContratoGeneral, OrdenadorContratoData, ParametroListResponse } from 'src/app/types/types';
import { OrdenadoresSupervisoresContratacionMidService } from 'src/app/services/ordenadores-supervisores-contratacion-mid.service';
import { cdpConstructorTabla, numeroALetras } from './paso-info-presupuestal.utilidades';
import { AlertService } from 'src/app/services/alert.service';

@Component({
    selector: 'app-paso-info-presupuestal',
    templateUrl: './paso-info-presupuestal.component.html',
    styleUrls: ['./paso-info-presupuestal.component.css'],
    standalone: false
})
export class PasoInfoPresupuestalComponent implements OnInit, OnDestroy {
  stepCompleted = output<boolean>();
  nextStep = output<void>();
  cdpGuardado = output<CDP[]>();
  contratoGuardado = output<void>();

  unidadEjecutora: string = '01'; //Valor que debe ser obtenido de algún flujo superior.
  contratoGeneral = input<ContratoGeneral>();

  form = this._formBuilder.group({
    vigencia: [''],
    cdp: [''],
    valorAcumulado: [{ value: 0, disabled: true }],
    tipoMoneda: [0, Validators.required],
    valorContrato: ['', Validators.required],
    ordenadorGasto: [0, Validators.required],
    nombreOrdenador: [{ value: '', disabled: true }, [Validators.required]],
    tipoGasto: [0, Validators.required],
    origenRecurso: [0, Validators.required],
    origenPresupuesto: [0, Validators.required],
    temaGasto: [0, Validators.required],
    monedaExtranjera: [0, Validators.required],
    tasaCambio: [0],
    medioPago: [0, Validators.required],
    clausulaRegistroPresupuestal: [false, Validators.required],
    reversarSaldos: [false],
    formaPago: ['', Validators.required],
  });

  get valorTotalAcumulado(): number {
    return this.selectedCDP.reduce((sum, row) => {
      const valor =
        row.valor_a_tomar !== undefined && row.valor_a_tomar !== null && row.valor_a_tomar !== ''
          ? this.parseNumero(row.valor_a_tomar)
          : this.parseNumero(row.valor_contratacion);
      return sum + valor;
    }, 0);
  }

  get valorContratoNum(): number {
    const val = this.form.get('valorContrato')?.value;
    return this.parseNumero(val);
  }

  get porcentajeCobertura(): string {
    const estimado = this.valorContratoNum;
    if (estimado <= 0) return '100.0';
    const porcentaje = (this.valorTotalAcumulado / estimado) * 100;
    return porcentaje.toFixed(1);
  }

  get coberturaSuficiente(): boolean {
    return this.valorTotalAcumulado >= this.valorContratoNum;
  }

  get valorEnLetras(): string {
    return numeroALetras(this.valorContratoNum);
  }

  monedas: any[] = [];
  gastos: any[] = [];
  origen_recursos: any[] = [];
  origen_presupuestos: any[] = [];
  tema_gasto: any[] = [];
  medios_pago: any[] = [];

  showCambioMonedaFields = false;

  vigencias: any[] = [{ value: '2024', viewValue: '2024' }];

  cdps: CDPItem[] = [];

  selectedCDP: CDP[] = []; // Lista de CDPs seleccionados (Tabla)
  cdpsContrato: CDPContratoCRUD[] = []; // Lista de CDPs asociados al contrato general

  private destroy$ = new Subject<void>();

  isLoading = false;

  ordenadores: any[] = [];
  nombreOrdenador: any[] = [];

  cdpConstructorTabla: any;
  tablaCdpColumnas: any;

  documentoIdentidadOrdenador: string | null = null;
  cargoIdOrdenador: number | null = null;
  idSicapitalOrdenador: number | null = null;
  ordenadorGastoId: number | null = null;

  constructor(
    private _formBuilder: FormBuilder,
    private alertService: AlertService,
    private parametrosService: ParametrosService,
    private cdRef: ChangeDetectorRef,
    private cdpsService: CdpsService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private ordenadoresSupervisoresMidService: OrdenadoresSupervisoresContratacionMidService,
  ) {}

  ngOnInit() {
    this.cargarCDPs();
    this.setupVigenciaListener();
    this.setupCdpListener();
    Promise.all([
      this.CargarMonedas(),
      this.CargarGastos(),
      this.CargarOrigenRecursos(),
      this.CargarOrigenPresupuesto(),
      this.CargarTemaGasto(),
      this.CargarMediosPago(),
      this.CargarRolOrdenadores(),
    ]).then(() => {
      this.loadSavedData();
    });

    this.form.get('tipoMoneda')?.valueChanges.subscribe((id_moneda) => {
      if (id_moneda) {
        this.CambioMoneda(id_moneda);
      }
    });

    this.form.get('ordenadorGasto')?.valueChanges.subscribe((rol) => {
      if (rol) {
        console.log('Si se llama a la función con el rol' + Number(rol));
        this.CargarOrdenadorActuales(Number(rol));
      }
    });

    this.form.statusChanges.subscribe(() => {
      this.stepCompleted.emit(this.form.valid);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadSavedData(): void {
    try {
      const contratoGeneral = this.contratoGeneral();
      if (contratoGeneral) {
        const formValues = {
          tipoGasto: contratoGeneral.tipo_gasto_id,
          origenPresupuesto: contratoGeneral.origen_presupuestos_id,
          temaGasto: contratoGeneral.tema_gasto_inversion_id,
          medioPago: contratoGeneral.medio_pago_id,
          tipoMoneda: contratoGeneral.tipo_moneda_id,
          valorContrato: contratoGeneral.valor_pesos?.toString(),
          origenRecurso: contratoGeneral.origen_recursos_id,
          clausulaRegistroPresupuestal: contratoGeneral.clausula_registro_presupuestal,
          formaPago: contratoGeneral.modo_pago,
        };

        this.contratoGeneralCrudService.gerOrdenadorGuardado(contratoGeneral.id as number).subscribe({
          next: (response: ApiResponse<OrdenadorContratoData>) => {
            this.ordenadorGastoId = response.Data.ordenador_argo_id;
            this.setOrdenadorGuardado();
          }
        });

        this.form.patchValue(formValues);

        if (contratoGeneral.id) {
          this.cargarCDPsContrato(contratoGeneral.id);
        }
      }

    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }

  private setOrdenadorGuardado() {
    this.form.get('ordenadorGasto')?.setValue(this.ordenadorGastoId)
  }

  async guardarYContinuar() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    try {
      this.isLoading = true;

      // Datos para la información presupuestal
      const formData = {
        tipo_gasto_id: this.form.get('tipoGasto')?.value,
        origen_presupuestos_id: this.form.get('origenPresupuesto')?.value,
        tema_gasto_inversion_id: this.form.get('temaGasto')?.value,
        medio_pago_id: this.form.get('medioPago')?.value,
        tipo_moneda_id: this.form.get('tipoMoneda')?.value,
        valor_pesos: this.form.get('valorContrato')?.value,
        origen_recursos_id: this.form.get('origenRecurso')?.value,
        clausula_registro_presupuestal: this.form.get('clausulaRegistroPresupuestal')?.value,
        modo_pago: this.form.get('formaPago')?.value,
      };

      const contratoId = this.contratoGeneral()?.id as number;

      this.ordenadorGastoId = this.form.get('ordenadorGasto')?.value as number;

      // Preparar datos para el POST de OrdenadorContrato
      const ordenadorContratoData: OrdenadorContratoData = {
        ordenador_argo_id: this.ordenadorGastoId ? Number(this.ordenadorGastoId) : 0,
        ordenador_sicapital_id: this.idSicapitalOrdenador
          ? Number(this.idSicapitalOrdenador)
          : 0,
        documento_identidad: this.documentoIdentidadOrdenador || '',
        cargo_id: this.cargoIdOrdenador || 0,
        contrato_general_id: contratoId,
      };

      // Realizar el POST al endpoint de OrdenadorContrato
      await firstValueFrom(
        this.contratoGeneralCrudService.postOrdenadorContrato(
          ordenadorContratoData
        )
      );

      // Actualizar en el backend la información presupuestal
      await firstValueFrom(
        this.contratoGeneralCrudService.put(contratoId, formData)
      );

      this.alertService.showSuccessAlert(
        'La información presupuestal se ha guardado correctamente',
        'Datos guardados'
      );

      this.contratoGuardado.emit();
      this.nextStep.emit();
    } catch (error) {
      console.error('Error saving data:', error);
      this.alertService.showErrorAlert(
        'Ocurrió un error al guardar la información presupuestal',
        'Error al guardar'
      );
    } finally {
      this.isLoading = false;
      this.cdRef.detectChanges();
    }
  }

  private cargarCDPsContrato(contratoId: number) {
    this.contratoGeneralCrudService
      .getCdpContrato(contratoId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (response) => {
          if (response && response.Data) {
            this.cdpsContrato = response.Data;

            if (this.cdpsService.getLocalCDP().length > 0) {
              return;
            }

            const cdpsRecuperados = await Promise.all(
              this.cdpsContrato.map(async (cdpContrato) => {
                try {
                  const responseCDP = await firstValueFrom(
                    this.cdpsService.get(
                      `cdps?vigencia=${cdpContrato.vigencia_cdp}&unidadEjecutora=${this.unidadEjecutora}&numeroDisponibilidad=${cdpContrato.numero_cdp_id}`
                    )
                  );

                  return responseCDP.Status === 200 && responseCDP.Data?.length > 0
                    ? (responseCDP.Data[0] as CDP)
                    : null;
                } catch (error) {
                  console.error(
                    `Error loading CDP ${cdpContrato.numero_cdp_id}:`,
                    error
                  );
                  return null;
                }
              })
            );

            this.selectedCDP = cdpsRecuperados.filter(
              (cdp): cdp is CDP => cdp !== null
            );
            this.cdpsService.updateLocalCDP(this.selectedCDP)
            this.updateValorAcumulado();
            this.removeSelectedCDPsFromList();
          }
        },
        error: (error) => {
          console.error('Error loading CDPs:', error);
        },
      });
  }

  cargarCDPs() {
    this.cdpConstructorTabla = cdpConstructorTabla;
    this.tablaCdpColumnas = this.cdpConstructorTabla.map(
      (column: any) => column.columnDef
    );
    const localCDPs = this.cdpsService.getLocalCDP();
    if (localCDPs && localCDPs.length > 0) {
      this.selectedCDP = localCDPs.map((cdp: CDP) => {
        if (cdp.valor_a_tomar === undefined || cdp.valor_a_tomar === null) {
          cdp.valor_a_tomar = this.parseNumero(cdp.valor_contratacion);
        }
        return cdp;
      });
      this.updateValorAcumulado();
      this.removeSelectedCDPsFromList();
    }
  }

  setupVigenciaListener() {
    this.form
      .get('vigencia')
      ?.valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((vigencia) => {
        if (vigencia) {
          this.obtenerNumeroDisponibilidad(vigencia);
        }
      });
  }

  setupCdpListener() {
    this.form
      .get('cdp')
      ?.valueChanges.pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe((cdp) => {
        const vigencia = this.form.get('vigencia')?.value;
        if (cdp && vigencia) {
          this.obtenerCDP(vigencia, cdp);
        }
      });
  }

  obtenerNumeroDisponibilidad(vigencia: string) {
    this.isLoading = true;
    this.cdps = [];
    this.form.get('cdp')?.reset();

    this.cdpsService
      .get(
        `cdps/numeros-disponibilidad?vigencia=${vigencia}&unidadEjecutora=${this.unidadEjecutora}`
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.Status === 200) {
            const uniqueCDPs = new Map<string, CDPData>();

            response.Data.forEach((cdp: CDPData) => {
              if (
                cdp.estadocdp !== 'AGOTADO' &&
                !uniqueCDPs.has(cdp.numero_disponibilidad)
              ) {
                uniqueCDPs.set(cdp.numero_disponibilidad, cdp);
              }
            });

            this.cdps = Array.from(uniqueCDPs.values()).map((cdp) => ({
              Id: cdp.numero_disponibilidad,
              Nombre: cdp.numero_disponibilidad,
            }));

            this.sortCDPs();

          } else {
            console.error('Error loading CDPs:', response.Message);
          }
        },
        error: (error) => {
          console.error('Error loading CDPs:', error);
        },
      });
  }

  obtenerCDP(vigencia: string, numeroDisponibilidad: string) {
    this.isLoading = true;
    this.cdpsService
      .get(
        `cdps?vigencia=${vigencia}&unidadEjecutora=${this.unidadEjecutora}&numeroDisponibilidad=${numeroDisponibilidad}`
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdRef.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.Status === 200) {
            const newCDP = response.Data[0]; //La respuesta puede retornar varias veces el mismo CDP
            if (newCDP) {
              newCDP.valor_a_tomar = this.parseNumero(newCDP.valor_contratacion);
              this.selectedCDP = [...this.selectedCDP, newCDP];
              this.updateValorAcumulado();
              this.removeSelectedCDPsFromList();
              this.form.get('cdp')?.reset();
            }
          } else {
            console.error('Error loading row data:', response.Message);
          }
        },
        error: (error) => {
          console.error('Error loading row data:', error);
        },
      });
  }

  removeSelectedCDPsFromList() {
    this.cdps = this.cdps.filter(
      (cdp) =>
        !this.selectedCDP.some(
          (selected) => selected.numero_disponibilidad === cdp.Id
        )
    );
  }

  async guardarListaCDP() {
    const contratoId = this.contratoGeneral()?.id as number;
    if (!contratoId) {
      this.alertService.showErrorAlert(
        'No se ha encontrado información general del contrato. PIP3'
      );
      return;
    }

    try {
      //Guardar en servicio
      this.cdpsService.updateLocalCDP(this.selectedCDP);

      //Preparamos el guardado en el api
      const cdpsGuardarCrud: CDPContratoCRUD[] = this.selectedCDP.map(
        (cdp) => ({
          numero_cdp_id: parseInt(cdp.numero_disponibilidad),
          fecha_registro: new Date(),
          vigencia_cdp: parseInt(cdp.vigencia),
          contrato_general_id: contratoId,
          valor_a_tomar: this.parseNumero(cdp.valor_a_tomar ?? cdp.valor_contratacion),
        })
      );

      const promesasGuardado = cdpsGuardarCrud.map((cdp) =>
        firstValueFrom(this.contratoGeneralCrudService.postCdp(cdp))
      );

      await Promise.all(promesasGuardado);

      this.alertService.showSuccessAlert(
        'Los CDPs ha sido guardada correctamente (local y en el servidor)'
      );
    } catch (error) {
      this.alertService.showErrorAlert(
        'No se ha podido guardar la lista de CDPs'
      );
    }
  }

  parseNumero(valor: any): number {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return isNaN(valor) ? 0 : valor;
    const limpio = valor.toString().replace(/[^0-9.-]+/g, '');
    const num = parseFloat(limpio);
    return isNaN(num) ? 0 : num;
  }

  onValorTomarChange(element: CDP) {
    const max = this.parseNumero(element.valor_contratacion);
    let valor = this.parseNumero(element.valor_a_tomar);

    if (valor < 0) {
      element.valor_a_tomar = 0;
      valor = 0;
    } else if (valor > max) {
      this.alertService.showAlert(
        `El valor a tomar no puede exceder el total aprobado del CDP ($ ${max.toLocaleString('es-CO')}).`,
        'Límite de CDP excedido'
      );
      element.valor_a_tomar = max;
      valor = max;
    }

    this.updateValorAcumulado();
    this.cdpsService.updateLocalCDP(this.selectedCDP);
  }

  updateValorAcumulado() {
    const valorAcumulado = this.selectedCDP.reduce((sum, row) => {
      const valor =
        row.valor_a_tomar !== undefined && row.valor_a_tomar !== null && row.valor_a_tomar !== ''
          ? this.parseNumero(row.valor_a_tomar)
          : this.parseNumero(row.valor_contratacion);
      return sum + valor;
    }, 0);

    this.form.get('valorAcumulado')?.setValue(valorAcumulado);
  }

  CargarMonedas() {
    return new Promise((resolve, reject) => {
      this.parametrosService.get<ParametroListResponse>(
        `parametro?query=TipoParametroId:${environment.TIPO_MONEDA},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe({
        next: (response: ParametroListResponse) => {
          if (response.Status == '200') {
            this.monedas = response.Data;
            resolve(true);
          } else {
            reject('Error en la respuesta del servidor');
          }
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  }

  CargarGastos(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.parametrosService
        .get<ParametroListResponse>(
          `parametro?query=TipoParametroId:${environment.TIPO_GASTO_ID},Activo:true&limit=0&sortby=numeroOrden&order=asc&fields=Id,Nombre`
        )
        .subscribe({
          next: (response: ParametroListResponse) => {
            if (response.Status == '200') {
              this.gastos = response.Data;
              resolve(true);
            } else {
              reject('Error en la respuesta del servidor');
            }
          },
          error: (error) => reject(error),
        });
    });
  }

  CargarOrigenRecursos(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.parametrosService
        .get<ParametroListResponse>(
          `parametro?query=TipoParametroId:${environment.ORIGEN_RECURSOS_ID},Activo:true&limit=0&sortby=numeroOrden&order=asc&fields=Id,Nombre`
        )
        .subscribe({
          next: (response: ParametroListResponse) => {
            if (response.Status == '200') {
              this.origen_recursos = response.Data;
              resolve(true);
            } else {
              reject('Error en la respuesta del servidor');
            }
          },
          error: (error) => reject(error),
        });
    });
  }

  CargarOrigenPresupuesto(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.parametrosService
        .get<ParametroListResponse>(
          `parametro?query=TipoParametroId:${environment.ORIGEN_PRESUPUESTO_ID},Activo:true&limit=0&sortby=numeroOrden&order=asc&fields=Id,Nombre`
        )
        .subscribe({
          next: (response: ParametroListResponse) => {
            if (response.Status == '200') {
              this.origen_presupuestos = response.Data;
              resolve(true);
            } else {
              reject('Error en la respuesta del servidor');
            }
          },
          error: (error) => reject(error),
        });
    });
  }

  CargarTemaGasto(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.parametrosService
        .get<ParametroListResponse>(
          `parametro?query=TipoParametroId:${environment.TEMA_GASTO_ID},Activo:true&limit=0&sortby=numeroOrden&order=asc&fields=Id,Nombre`
        )
        .subscribe({
          next: (response: ParametroListResponse) => {
            if (response.Status == '200') {
              this.tema_gasto = response.Data;
              resolve(true);
            } else {
              reject('Error en la respuesta del servidor');
            }
          },
          error: (error) => reject(error),
        });
    });
  }

  CargarMediosPago(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.parametrosService
        .get<ParametroListResponse>(
          `parametro?query=TipoParametroId:${environment.MEDIO_PAGO_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
        )
        .subscribe({
          next: (response: ParametroListResponse) => {
            if (response.Status == '200') {
              this.medios_pago = response.Data;
              resolve(true);
            } else {
              reject('Error en la respuesta del servidor');
            }
          },
          error: (error) => reject(error),
        });
    });
  }

  CargarRolOrdenadores(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.ordenadoresSupervisoresMidService
        .getRolOrdenadores()
        .subscribe({
          next: (response: any) => {
            if (response.Status === 200) {
              this.ordenadores = response.Data;
              this.setOrdenadorGuardado();
              resolve(true);
            } else {
              reject('Error en la respuesta del servidor');
            }
          },
          error: (error) => reject(error),
        });
    });
  }

  CargarOrdenadorActuales(rol: number) {
    this.ordenadoresSupervisoresMidService
      .getOrdenadorActuales(rol)
      .subscribe(async (response: any) => {
        console.log('Respuesta de ordenadores', response);
        if (response.Status === 200) {
          this.form
            .get('nombreOrdenador')
            ?.setValue(response.Data[0].nombre_ordenador);
        } else {
          this.form.get('ordenadorGasto')?.reset();
          this.form.get('nombreOrdenador')?.reset();
          this.alertService.showErrorAlert(
            'No se encontraron ordenadores para el rol seleccionado'
          );
        }
      });
  }

  CambioMoneda(id_moneda: number) {

    this.showCambioMonedaFields =
      id_moneda !== environment.PESO_COLOMBIANO_ID;

    const monedaFields = ['monedaExtranjera', 'tasaCambio'];

    [...monedaFields].forEach((field) => {
      const control = this.form.get(field);
      if (control) {
        control.reset();
        if (this.showCambioMonedaFields && monedaFields.includes(field)) {
          control.setValidators(Validators.required);
          control.enable();
        } else {
          control.clearValidators();
          control.disable();
        }
        control.updateValueAndValidity();
      }
    });
    this.cdRef.detectChanges();
  }

  // Método para manejar la entrada de solo números

  onlyNumbers(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace',
      'Tab',
      'End',
      'Home',
      'ArrowLeft',
      'ArrowRight',
      'Delete',
    ];
    const pattern = /^[0-9]$/;

    if (!allowedKeys.includes(event.key) && !pattern.test(event.key)) {
      event.preventDefault();
    }
  }

  sortCDPs() {
    this.cdps.sort((a, b) => {
      const numA = parseInt(a.Id, 10);
      const numB = parseInt(b.Id, 10);
      return numA - numB;
    });
  }

  async eliminarCDP(cdpAEliminar: CDP) {
    const contratoId = this.contratoGeneral()?.id as number;
    try {
      if (contratoId) {
        const cdpContrato = this.cdpsContrato.find(
          (c) =>
            c.numero_cdp_id === parseInt(cdpAEliminar.numero_disponibilidad)
        );

        if (cdpContrato && cdpContrato.id) {
          await firstValueFrom(
            this.contratoGeneralCrudService.deleteCdp(cdpContrato.id)
          );
        }

        this.selectedCDP = this.selectedCDP.filter(
          (cdp) =>
            cdp.numero_disponibilidad !== cdpAEliminar.numero_disponibilidad
        );

        this.updateValorAcumulado();

        this.cdps.push({
          Id: cdpAEliminar.numero_disponibilidad,
          Nombre: cdpAEliminar.numero_disponibilidad,
        });

        this.cdpsService.updateLocalCDP(this.selectedCDP);

        this.sortCDPs();

        await this.alertService.showSuccessAlert('CDP eliminado correctamente');
      }
    } catch (error) {
      this.alertService.showErrorAlert('Hubo un error al eliminar el CDP');
    }

    this.form.get('cdp')?.reset();
  }

  async onInView(inView: boolean) {
    if (inView) {
      //this.loadSavedData();
    } else {
      console.log('Paso Info Presupuestal - out of view');
    }
  }
}
