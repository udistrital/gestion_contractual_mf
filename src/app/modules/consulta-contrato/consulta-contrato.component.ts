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

@Component({
  selector: 'app-consulta-contrato',
  templateUrl: './consulta-contrato.component.html',
  styleUrls: ['./consulta-contrato.component.css'],
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
      'Ver Historial': 'info',
      Declinar: 'cancel',
      'Revisar Contrato': 'find_in_page',
      'Ver Documentos': 'my_library_books',
    };
    return iconos[accion] || 'help'; // Devuelve 'help' si no se encuentra un ícono
  }

  realizarAccion(contrato: ContratoGeneral, accion: string) {
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
      case 'Ver Historial':
        this.openModalObservaciones(contrato.id);
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

  openModalObservaciones(idContrato: number): void {
    this.dialog.open(ModalObservacionesComponent, {
      width: '70vw',
      maxHeight: '35vw',
      // height: '35vw',
      data: { idContrato },
    });
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.tamanioPagina = event.pageSize;
    this.consultar();
  }

  consultar() {
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

  // verDetalle(contrato: ContratoGeneral) {
  //   this.router.navigate(['/detalle', contrato.id]);
  // }

  private prepararParametros() {
    const formValues = this.form.value;
    const params: any = {};

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
    if (formValues.fechaDesde) params.fechaDesde = formValues.fechaDesde;
    if (formValues.fechaHasta) params.fechaHasta = formValues.fechaHasta;
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
