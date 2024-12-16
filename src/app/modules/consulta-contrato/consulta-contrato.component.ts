import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { ContratoGeneralMidService } from '../../services/contrato-general-mid.service';
import Swal from 'sweetalert2';
import { RolService } from 'src/app/services/rol.service';
import { ModalObservacionesComponent } from './modal-observaciones/modal-observaciones.component';
import { MatDialog } from '@angular/material/dialog';
import { ContratoGeneral } from 'src/app/types/types';
import { accionesPorRolYEstado } from './estados_acciones';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

export const FORMATO_LOCAL_FECHA = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-consulta-contrato',
  templateUrl: './consulta-contrato.component.html',
  styleUrls: ['./consulta-contrato.component.css'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: FORMATO_LOCAL_FECHA }
  ]
})
export class ConsultaContratoComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<ContratoGeneral>();
  isLoading = false;
  totalRegistros = 0;
  tamanioPagina = 10;
  paginaActual = 0;
  roles: string[] = [];
  // accionesPermitidas: string[] = ['Enviar Aprobación Jefe OC'];
  unidadEjecucion: any[] = [];
  vigencia: any[] = [];
  tipoContratoId: any[] = [];
  tipoPersona: any[] = [];
  numeroElaboracion: any[] = [];
  numeroContrato: any[] = [];
  contratista: any[] = [];
  estado: any[] = [];
  fechaDesde: any[] = [];
  fechaHasta: any[] = [];
  displayedColumns: string[] = [
    'vigencia',
    'tipoContratoId',
    'tipo_persona',
    'numero_contrato',
    'contratista',
    'fecha_registro',
    'fecha_aprobado',
    'estado',
    'acciones',
  ];

  constructor(
    public dialog: MatDialog,
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private contratoMidService: ContratoGeneralMidService,
    private rolService: RolService,
    private router: Router
  ) {}

  form = this._formBuilder.group({
    unidadEjecucion: [''],
    vigencia: [''],
    tipoContratoId: [''],
    tipoPersona: [''],
    numeroElaboracion: [''],
    numeroContrato: [''],
    contratista: [''],
    estado: [''],
    fechaDesde: [''],
    fechaHasta: [''],
  });

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.CargarunidadEjecutoraId();
    this.CargarVigencia();
    this.CargartipoContratoIds();
    this.CargarTipoPersona();
    this.CargarEstado();
    this.form.get('fechaDesde')?.valueChanges.subscribe(value => {
      if (value) {
        const fechaHasta = this.form.get('fechaHasta')?.value;
        if (fechaHasta && new Date(value) > new Date(fechaHasta)) {
          this.form.patchValue({
            fechaDesde: fechaHasta
          });
        }
      }
    });

    this.form.get('fechaHasta')?.valueChanges.subscribe(value => {
      if (value) {
        const fechaDesde = this.form.get('fechaDesde')?.value;
        if (fechaDesde && new Date(value) < new Date(fechaDesde)) {
          this.form.patchValue({
            fechaHasta: fechaDesde
          });
        }
      }
    });

    this.consultar();
  }

  getAccionesPorRolYEstado(contrato: ContratoGeneral) {
    const estado = contrato.estados.estado_interno_parametro_id;

    // Usar un conjunto para evitar duplicados
    const accionesSet = new Set<string>();
    this.roles.forEach((rol) => {
      const acciones = accionesPorRolYEstado[rol]?.[estado];
      if (acciones) {
        acciones.forEach((accion: any) => accionesSet.add(accion));
      }
    });
    return Array.from(accionesSet);
  }

  getIconoAccion(accion: string): string {
    const iconos: { [key: string]: string } = {
      'Ver Contrato': 'visibility',
      'Editar Contrato': 'edit',
      'Enviar Aprobación Jefe OC': 'send',
      'Motivo de rechazo': 'info',
      Declinar: 'cancel',
      'Revisar Contrato': 'find_in_page',
      'Ver Documentos': 'my_library_books',
    };
    return iconos[accion] || 'help'; // Devuelve 'help' si no se encuentra un ícono
  }

  realizarAccion(contrato: ContratoGeneral, accion: string) {
    console.log(contrato);
    switch (accion) {
      case 'Ver Contrato':
        this.router.navigate(['/registrar']);
        break;
      case 'Editar Contrato':
        this.router.navigate(['/registrar']);
        break;
      case 'Enviar Aprobación Jefe OC':
        console.log('Enviar Aprobación Jefe OC');
        break;
      case 'Motivo de rechazo':
        this.openModalObservaciones();
        break;
      case 'Declinar':
        console.log('Declinar');
        break;
      case 'Revisar Contrato':
      case 'Ver Documentos':
        this.router.navigate([`/${contrato.id}/documentos`]);
        break;
      default:
        break;
    }
  }

  openModalObservaciones(): void {
    this.dialog.open(ModalObservacionesComponent, {
      width: '70vw',
      height: '35vw',
      data: {},
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.tamanioPagina = event.pageSize;
    this.consultar(false);
  }


  consultar(resetPage: boolean = true) {
    if (resetPage) {
      if (this.paginator) {
        this.paginator.firstPage();
      }
      this.paginaActual = 0;
    }

    this.isLoading = true;
    const params = {
      ...this.prepararParametros(),
      limit: this.tamanioPagina,
      offset: this.paginaActual * this.tamanioPagina,
    };

    this.contratoMidService.getContratos(params).subscribe({
      next: (response) => {
        if (response.Success && response.Status === 200) {
          this.dataSource.data = response.Data;
          this.totalRegistros = response.Metadata.total;
        }
      },
      error: async (error) => {
        console.error('Error al consultar contratos:', error);
        await Swal.fire('Error', 'Error al consultar contratos', 'error');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }


  limpiarFiltros() {
    this.form.reset();
    this.paginaActual = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.consultar();
  }

  verDetalle(contrato: ContratoGeneral) {
    this.router.navigate(['/detalle', contrato.id]);
  }

  private prepararParametros() {
    const formValues = this.form.value;
    const params: any = {
      limit: this.tamanioPagina,
      offset: this.paginaActual * this.tamanioPagina
    };

    if (formValues.unidadEjecucion)
      params.unidadEjecucion = formValues.unidadEjecucion;
    if (formValues.vigencia) params.vigencia = formValues.vigencia;
    if (formValues.tipoContratoId)
      params.tipoContratoId = formValues.tipoContratoId;
    if (formValues.tipoPersona) {
      params.contratista = params.contratista || {};
      params.contratista.tipo_persona_id = formValues.tipoPersona;
    }
    if (formValues.contratista) {
      params.contratista = params.contratista || {};
      params.contratista.numero_documento = formValues.contratista;
    }
    if (formValues.numeroElaboracion)
      params.numeroElaboracion = formValues.numeroElaboracion;
    if (formValues.numeroContrato) params.id = formValues.numeroContrato;
    if (formValues.estado) {
      params.estados = params.estados || {};
      params.estados.estado_parametro_id = formValues.estado;
    }
    if (formValues.fechaDesde || formValues.fechaHasta) {
      params.fechaCreacion = {};

      if (formValues.fechaDesde) {
        params.fechaCreacion.start = new Date(formValues.fechaDesde).toISOString().split('T')[0];
      }

      if (formValues.fechaHasta) {
        params.fechaCreacion.end = new Date(formValues.fechaHasta).toISOString().split('T')[0];
      }
    }
    return params;
  }

  CargarunidadEjecutoraId() {}

  CargarVigencia() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.VIGENCIA_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.vigencia = Response.Data;
        }
      });
  }

  CargartipoContratoIds() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.TIPO_CONTRATO_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.tipoContratoId = Response.Data;
        }
      });
  }

  CargarTipoPersona() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.TIPO_PERSONA_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.tipoPersona = Response.Data;
        }
      });
  }

  CargarEstado() {
    this.parametrosService
      .get(
        'parametro?query=TipoParametroId:' +
          environment.TIPO_ESTADO_ID +
          '&limit=0'
      )
      .subscribe((Response: any) => {
        if (Response.Status == '200') {
          this.estado = Response.Data;
        }
      });
  }
}
