import { Component, OnInit, OnChanges, OnDestroy, inject, output, input, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CdpsService } from "src/app/services/cdps.service";
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { AlertService } from 'src/app/services/alert.service';
import { Subscription } from "rxjs";
import { ContratoGeneral } from 'src/app/types/types';

interface CDP {
  vigencia: string;
  descripcion: string;
  rubro_interno: string;
  estado: string;
  justificacion: string;
  id_sol_cdp: string;
  nombre_dependencia: string;
  fecha_registro: string;
  observaciones: string;
  numero_disponibilidad: string;
  num_sol_adq: string;
  valor_contratacion: string;
  estadocdp: string;
}

export interface ActividadEspecifica {
  id: string;
  numero: number;
  titulo?: string;
  descripcion: string;
  entregables: string[];
  plazo?: string;
}

@Component({
    selector: 'app-paso-obligaciones',
    templateUrl: './paso-obligaciones.component.html',
    styleUrls: ['./paso-obligaciones.component.css'],
    standalone: false
})
export class PasoObligacionesComponent implements OnInit, OnDestroy {
  nextStep = output<void>();
  stepCompleted = output<boolean>();
  contratoGuardado = output<void>();
  contratoGeneral = input<ContratoGeneral>()
  viewMode = input<boolean>(false);

  form: FormGroup;
  cdpData: CDP[] = [];
  private cdpSubscription: Subscription = new Subscription();
  private previousCDPCount: number = 0;

  private readonly _formBuilder = inject(FormBuilder);
  private readonly cdpService = inject(CdpsService);
  private readonly contratoService = inject(ContratoGeneralCrudService);
  private readonly alertService = inject(AlertService);

  // Gestión estructurada de Actividades Específicas
  actividadesList: ActividadEspecifica[] = [];
  modalActividadAbierto: boolean = false;
  modoEdicionActividad: boolean = false;
  indiceEdicionActividad: number | null = null;
  actividadEnEdicion: ActividadEspecifica = this.crearActividadVacia();
  nuevoEntregableTexto: string = '';
  mostrarParrafoCompilado: boolean = false;

  constructor() { 
    this.form = this._formBuilder.group({
      justificacion: ['', Validators.required],
      objetoContrato: ['', Validators.required],
      actividades: ['', Validators.required]
    });

    effect(() => {
      const c = this.contratoGeneral();
      if (c) {
        this.updateFormWithCDPData();
      }
      this.aplicarModoVisualizacion();
    });
  }

  ngOnInit() {
    this.cdpSubscription = this.cdpService.cdp$.subscribe(data => {
      this.cdpData = data;
      this.updateFormWithCDPData();
    });
    if (this.contratoGeneral()) {
      this.updateFormWithCDPData();
    }
    this.aplicarModoVisualizacion();
  }

  /** En modo visualización el formulario queda en solo lectura. */
  private aplicarModoVisualizacion(): void {
    if (this.viewMode()) {
      this.form.disable({ emitEvent: false });
    }
  }

  ngOnDestroy() {
    if (this.cdpSubscription) {
      this.cdpSubscription.unsubscribe();
      this.cdpService.updateLocalCDP([]);
    }
  }

  loadCDPData() {
    //this.cdpData = this.cdpService.getLocalCDP();
    this.updateFormWithCDPData();
  }

  updateFormWithCDPData() {
    const currentCDPCount = this.cdpData.length;

    if (currentCDPCount === 1) {
      const cdp = this.cdpData[0];
      const contrato = this.contratoGeneral();
      const justificacionVal = contrato?.justificacion || cdp.justificacion || '';
      const objetoVal = contrato?.objeto || cdp.descripcion || '';
      const actividadesVal = contrato?.actividades || cdp.observaciones || '';

      this.form.patchValue({
        justificacion: justificacionVal,
        objetoContrato: objetoVal,
        actividades: actividadesVal
      });

      if (this.actividadesList.length === 0 && actividadesVal) {
        this.cargarActividadesDesdeTexto(actividadesVal);
      } else if (this.actividadesList.length > 0) {
        this.actualizarParrafoCompilado();
      }
    } else if (currentCDPCount >= 2 || currentCDPCount === 0) {
      this.resetForm();
      const contratoData = this.contratoGeneral();
      if (contratoData) {
        const justificacionVal = contratoData.justificacion || '';
        const objetoVal = contratoData.objeto || '';
        const actividadesVal = contratoData.actividades || '';

        this.form.patchValue({
          justificacion: justificacionVal,
          objetoContrato: objetoVal,
          actividades: actividadesVal
        });

        if (this.actividadesList.length === 0 && actividadesVal) {
          this.cargarActividadesDesdeTexto(actividadesVal);
        } else if (this.actividadesList.length > 0) {
          this.actualizarParrafoCompilado();
        }
      }
    }

    this.previousCDPCount = currentCDPCount;
    this.aplicarModoVisualizacion();
  }

  resetForm() {
    this.form.patchValue({
      justificacion: '',
      objetoContrato: '',
      actividades: ''
    });
  }

  onInView(inView: boolean) {
    if (inView) {
      // this.loadCDPData();
    }
  }

  get hasSingleCDP(): boolean {
    return this.cdpData.length === 1;
  }

  reSincronizarSicapital() {
    this.loadCDPData();
    this.alertService.showAlert('Información re-sincronizada desde SICAPITAL / CDP.', 'Sincronización');
  }

  // =========================================================================
  // Gestión de Actividades Específicas Estructuradas (JSON & Párrafo Compilado)
  // =========================================================================

  crearActividadVacia(): ActividadEspecifica {
    return {
      id: `act-${Date.now()}`,
      numero: this.actividadesList.length + 1,
      titulo: '',
      descripcion: '',
      entregables: [],
      plazo: ''
    };
  }

  cargarActividadesDesdeTexto(texto: string) {
    if (!texto || !texto.trim() || this.actividadesList.length > 0) {
      return;
    }

    const bloques = texto.split(/\n\s*\n/).map((b) => b.trim()).filter((b) => !!b);
    const nuevasActividades: ActividadEspecifica[] = [];

    for (let i = 0; i < bloques.length; i++) {
      const bloque = bloques[i];
      let limpio = bloque.replace(/^\d+[\.\)]\s*/, '');
      
      let entregables: string[] = [];
      let plazo = '';

      const plazoMatch = limpio.match(/Plazo\/Periodicidad:\s*([^.]+)\.?/i);
      if (plazoMatch) {
        plazo = plazoMatch[1].trim();
        limpio = limpio.replace(/Plazo\/Periodicidad:\s*([^.]+)\.?/i, '').trim();
      }

      const entregablesMatch = limpio.match(/Entregable\(s\):\s*([^.]+)\.?/i);
      if (entregablesMatch) {
        entregables = entregablesMatch[1].split(';').map((e) => e.trim()).filter((e) => !!e);
        limpio = limpio.replace(/Entregable\(s\):\s*([^.]+)\.?/i, '').trim();
      }

      nuevasActividades.push({
        id: `act-${Date.now()}-${i}`,
        numero: i + 1,
        descripcion: limpio.trim(),
        entregables: entregables,
        plazo: plazo
      });
    }

    if (nuevasActividades.length > 0) {
      this.actividadesList = nuevasActividades;
      this.renumerarActividades();
      this.actualizarParrafoCompilado();
    }
  }

  renumerarActividades() {
    this.actividadesList.forEach((act, idx) => {
      act.numero = idx + 1;
    });
  }

  formatearNumero(num: number): string {
    return num.toString().padStart(2, '0');
  }

  generarParrafoActividades(): string {
    if (!this.actividadesList || this.actividadesList.length === 0) {
      return '';
    }
    return this.actividadesList
      .map((act, index) => {
        const num = (index + 1).toString().padStart(2, '0');
        let parrafo = `${num}. ${act.descripcion.trim()}`;
        if (act.entregables && act.entregables.length > 0) {
          const entregablesTexto = act.entregables.filter(e => !!e.trim()).join('; ');
          if (entregablesTexto) {
            parrafo += ` Entregable(s): ${entregablesTexto}.`;
          }
        }
        if (act.plazo && act.plazo.trim()) {
          parrafo += ` Plazo/Periodicidad: ${act.plazo.trim()}.`;
        }
        return parrafo;
      })
      .join('\n\n');
  }

  actualizarParrafoCompilado() {
    const parrafoCompilado = this.generarParrafoActividades();
    if (this.actividadesList.length > 0) {
      this.form.patchValue({ actividades: parrafoCompilado });
    }
  }

  abrirModalNuevaActividad() {
    this.modoEdicionActividad = false;
    this.indiceEdicionActividad = null;
    this.actividadEnEdicion = this.crearActividadVacia();
    this.nuevoEntregableTexto = '';
    this.modalActividadAbierto = true;
  }

  abrirModalEditarActividad(index: number) {
    this.modoEdicionActividad = true;
    this.indiceEdicionActividad = index;
    const act = this.actividadesList[index];
    this.actividadEnEdicion = {
      id: act.id,
      numero: act.numero,
      titulo: act.titulo || '',
      descripcion: act.descripcion,
      entregables: [...(act.entregables || [])],
      plazo: act.plazo || ''
    };
    this.nuevoEntregableTexto = '';
    this.modalActividadAbierto = true;
  }

  cerrarModalActividad() {
    this.modalActividadAbierto = false;
    this.indiceEdicionActividad = null;
    this.nuevoEntregableTexto = '';
  }

  agregarEntregable() {
    if (this.nuevoEntregableTexto && this.nuevoEntregableTexto.trim()) {
      this.actividadEnEdicion.entregables.push(this.nuevoEntregableTexto.trim());
      this.nuevoEntregableTexto = '';
    }
  }

  removerEntregable(idx: number) {
    this.actividadEnEdicion.entregables.splice(idx, 1);
  }

  guardarActividadEnEdicion() {
    if (!this.actividadEnEdicion.descripcion || !this.actividadEnEdicion.descripcion.trim()) {
      this.alertService.showErrorAlert('La descripción de la actividad es obligatoria.');
      return;
    }
    // Si quedó texto sin agregar en el input de entregable, agregarlo
    if (this.nuevoEntregableTexto && this.nuevoEntregableTexto.trim()) {
      this.agregarEntregable();
    }

    if (this.modoEdicionActividad && this.indiceEdicionActividad !== null) {
      this.actividadesList[this.indiceEdicionActividad] = {
        ...this.actividadEnEdicion,
        numero: this.indiceEdicionActividad + 1
      };
    } else {
      this.actividadesList.push({
        ...this.actividadEnEdicion,
        numero: this.actividadesList.length + 1
      });
    }

    this.renumerarActividades();
    this.actualizarParrafoCompilado();
    this.cerrarModalActividad();
  }

  eliminarActividad(index: number) {
    this.actividadesList.splice(index, 1);
    this.renumerarActividades();
    this.actualizarParrafoCompilado();
  }

  moverActividad(index: number, direccion: 'arriba' | 'abajo') {
    if (direccion === 'arriba' && index > 0) {
      const temp = this.actividadesList[index];
      this.actividadesList[index] = this.actividadesList[index - 1];
      this.actividadesList[index - 1] = temp;
    } else if (direccion === 'abajo' && index < this.actividadesList.length - 1) {
      const temp = this.actividadesList[index];
      this.actividadesList[index] = this.actividadesList[index + 1];
      this.actividadesList[index + 1] = temp;
    }
    this.renumerarActividades();
    this.actualizarParrafoCompilado();
  }

  toggleMostrarParrafoCompilado() {
    this.mostrarParrafoCompilado = !this.mostrarParrafoCompilado;
  }

  // =========================================================================
  // Guardado Final del Paso
  // =========================================================================

  guardarObligaciones() {
    if (this.form.valid && (this.contratoGeneral()?.id as number)) {
      this.alertService.showConfirmAlert(
        '¿Está seguro de guardar las obligaciones registradas?',
        'Guardar Obligaciones').then((result) => {
        if (result.isConfirmed) {
          const obligacionesData = {
            justificacion: this.form.get('justificacion')?.value,
            objeto: this.form.get('objetoContrato')?.value,
            actividades: this.form.get('actividades')?.value
          };
          this.contratoService.put(this.contratoGeneral()?.id as number, obligacionesData).subscribe({
            next: (response) => {
              if (response.Success) {
                this.alertService.showSuccessAlert('Obligaciones guardadas exitosamente.');
                this.contratoGuardado.emit();
                this.stepCompleted.emit(true);
                this.nextStep.emit();
              }
            }
          });
        }
      });
    } else {
      this.alertService.showErrorAlert('Por favor, complete todos los campos requeridos antes de guardar.');
    }
  }
}

