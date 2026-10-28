import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PolizasService } from '../../../../services/polizas.service';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-datos-basicos',
  templateUrl: './datos-basicos.component.html',
  styleUrls: ['./datos-basicos.component.css'],
  standalone: false,
})
export class DatosBasicosComponent implements OnDestroy {
  @Input() set contratoId(value: string | null) {
    this._contratoId = value;
    this.polizaId = null;
    this.polizaForm.reset();
    if (value) {
      this.cargarPoliza(+value);
    }
  }
  get contratoId(): string | null {
    return this._contratoId;
  }
  private _contratoId: string | null = null;

  /** Emite el id de la póliza guardada, para que amparo-contrato la vincule. */
  @Output() polizaGuardada = new EventEmitter<number>();

  polizaForm: FormGroup = this.createForm();
  polizaId: number | null = null;
  isLoading = false;
  private subscription = new Subscription();

  // TODO(#352): reemplazar por el catálogo real de aseguradoras cuando se
  // entregue el endpoint (ver docs/integracion-polizas-352.md).
  entidadesAseguradoras: any[] = [
    { name: 'Seguros del Estado', id: 1 },
    { name: 'Seguros Bolívar', id: 2 },
    { name: 'La Previsora Seguros', id: 3 },
    { name: 'Aseguradora Solidaria de Colombia', id: 4 },
  ];

  constructor(
    private fb: FormBuilder,
    private polizasService: PolizasService
  ) {}

  private createForm(): FormGroup {
    return this.fb.group({
      numero_poliza: ['', Validators.required],
      fecha_inicio: [null, Validators.required],
      fecha_fin: [null, Validators.required],
      fecha_expedicion: [null, Validators.required],
      fecha_aprobacion: [null, Validators.required],
      entidad_aseguradora_id: ['', Validators.required],
      descripcion: ['', Validators.required],
    });
  }

  private cargarPoliza(contratoGeneralId: number) {
    this.isLoading = true;
    this.subscription.add(
      this.polizasService.getPolizaPorContrato(contratoGeneralId).subscribe({
        next: (response: any) => {
          this.isLoading = false;
          const poliza = response?.Data?.[0];
          if (poliza) {
            const polizaId: number = poliza.id;
            this.polizaId = polizaId;
            this.polizaForm.patchValue({
              numero_poliza: poliza.numero_poliza,
              fecha_inicio: poliza.fecha_inicio ? new Date(poliza.fecha_inicio) : null,
              fecha_fin: poliza.fecha_fin ? new Date(poliza.fecha_fin) : null,
              fecha_expedicion: poliza.fecha_expedicion
                ? new Date(poliza.fecha_expedicion)
                : null,
              fecha_aprobacion: poliza.fecha_aprobacion
                ? new Date(poliza.fecha_aprobacion)
                : null,
              entidad_aseguradora_id: poliza.entidad_aseguradora_id,
              descripcion: poliza.descripcion,
            });
            this.polizaGuardada.emit(polizaId);
          }
        },
        error: () => {
          this.isLoading = false;
        },
      })
    );
  }

  onSubmit() {
    if (!this.polizaForm.valid || !this.contratoId) {
      return;
    }

    const formValue = this.polizaForm.value;
    const body = {
      contrato_general_id: +this.contratoId,
      numero_poliza: formValue.numero_poliza,
      fecha_inicio: this.toIsoDate(formValue.fecha_inicio),
      fecha_fin: this.toIsoDate(formValue.fecha_fin),
      fecha_expedicion: this.toIsoDate(formValue.fecha_expedicion),
      fecha_aprobacion: this.toIsoDate(formValue.fecha_aprobacion),
      entidad_aseguradora_id: formValue.entidad_aseguradora_id,
      descripcion: formValue.descripcion,
    };

    const request$ = this.polizaId
      ? this.polizasService.putPoliza(this.polizaId, body)
      : this.polizasService.postPoliza(body);

    request$.subscribe({
      next: (response: any) => {
        this.polizaId = response?.Data?.id ?? this.polizaId;
        Swal.fire({
          icon: 'success',
          title: 'Éxito',
          text: 'Póliza guardada exitosamente',
        });
        if (this.polizaId) {
          this.polizaGuardada.emit(this.polizaId);
        }
      },
      error: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text:
            'Error al guardar la póliza: ' +
            (error.message || 'Error del servidor'),
        });
      },
    });
  }

  private toIsoDate(value: Date | string | null): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return date.toISOString();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
