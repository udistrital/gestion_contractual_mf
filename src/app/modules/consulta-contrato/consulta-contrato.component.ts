import {Component, OnInit, ViewChild} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {Router} from "@angular/router";
import {ContratoGeneralMidService} from "../../services/contrato-general-mid.service";
import Swal from "sweetalert2";
import { ImplicitAutenticationService } from 'src/app/services/implicit_autentication.service';
import { RolService } from 'src/app/services/rol.service';

interface ContratoGeneral {
  id: number;
  vigencia: string;
  tipoContratoId: string;
  tipo_persona: string;
  numero_contrato: string;
  contratista: string;
  fecha_registro: string | null;
  fecha_aprobado: string | null;
  estado: string;
  documentos: number;
}

@Component({
  selector: 'app-consulta-contrato',
  templateUrl: './consulta-contrato.component.html',
  styleUrls: ['./consulta-contrato.component.css']
})
export class ConsultaContratoComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = [
    'vigencia',
    'tipoContratoId',
    'tipo_persona',
    'numero_contrato',
    'contratista',
    'fecha_registro',
    'fecha_aprobado',
    'estado',
    'documentos',
    'acciones'
  ];

  dataSource = new MatTableDataSource<ContratoGeneral>();
  isLoading = false;
  totalRegistros = 0;
  tamanioPagina = 10;
  paginaActual = 0;
  roles: string[] = [];
  accionesPermitidas: string[] = [];

  constructor(
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private contratoMidService: ContratoGeneralMidService,
    private rolService: RolService,
    private router: Router
  ) { }

  form = this._formBuilder.group({
    unidadEjecutora: [''],
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

  vigencia: any[] = [];
  tipoPersona: any[] = [];

  ngOnInit(): void {
    this.roles = this.rolService.getRol();
    this.definirAccionesPorRol(this.roles)
    this.CargarVigencia();
    this.CargarTipoPersona();
    this.consultar();
  }

  definirAccionesPorRol(roles: string[]) {
    const accionesPorRol: { [key: string]: string[] } = {
      'CONTRATISTA': ['Ver Contrato', 'Editar Contrato', 'Revisar Contrato', 'Enviar Aprobación Jefe OC'],
      'JEFE_DEPENDENCIA': ['Revisar Contrato'],
      'ORDENADOR_DEL_GASTO': ['Revisar Contrato'],
    };

    // Usar un conjunto para evitar duplicados
    const accionesSet = new Set<string>();
    roles.forEach(rol => {
      const acciones = accionesPorRol[rol];
      if (acciones) {
        acciones.forEach(accion => accionesSet.add(accion));
      }
    });
    this.accionesPermitidas = Array.from(accionesSet);
  }

  getIconoAccion(accion: string): string {
    const iconos: { [key: string]: string } = {
      'Ver Contrato': 'visibility',
      'Editar Contrato': 'edit',
      'Revisar Contrato': 'assignment',
      'Enviar Aprobación Jefe OC': 'send'
    };
    return iconos[accion] || 'help'; // Devuelve 'help' si no se encuentra un ícono
  }

  realizarAccion(accion: string) {
    switch (accion) {
      case 'Ver Contrato':
        this.router.navigate(['/registrar']);
        break;
      case 'Editar Contrato':
        this.router.navigate(['/registrar']);
        break;
      case 'Revisar Contrato':
        this.router.navigate(['/revisar']);
        break;
      case 'Enviar Aprobación Jefe OC':
        console.log("Enviar Aprobación Jefe OC");
        break;
      default:
        break;
    }
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
      offset: this.paginaActual * this.tamanioPagina
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
      }
    });
  }

  // verDetalle(contrato: ContratoGeneral) {
  //   this.router.navigate(['/detalle', contrato.id]);
  // }

  private prepararParametros() {
    const formValues = this.form.value;
    const params: any = {};

    if (formValues.unidadEjecutora) params.unidadEjecutora = formValues.unidadEjecutora;
    if (formValues.vigencia) params.vigencia = formValues.vigencia;
    if (formValues.tipoContratoId) params.tipoContratoId = formValues.tipoContratoId;
    if (formValues.tipoPersona) params.tipoPersona = formValues.tipoPersona;
    if (formValues.numeroElaboracion) params.numeroElaboracion = formValues.numeroElaboracion;
    if (formValues.numeroContrato) params.numeroContrato = formValues.numeroContrato;
    if (formValues.contratista) params.contratista = formValues.contratista;
    if (formValues.estado) params.estado = formValues.estado;
    if (formValues.fechaDesde) params.fechaDesde = formValues.fechaDesde;
    if (formValues.fechaHasta) params.fechaHasta = formValues.fechaHasta;

    return params;
  }

  CargarVigencia() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.VIGENCIA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.vigencia = Response.Data;
      }
    })
  }

  CargarTipoPersona() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_PERSONA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tipoPersona = Response.Data;
      }
    })
  }
}
