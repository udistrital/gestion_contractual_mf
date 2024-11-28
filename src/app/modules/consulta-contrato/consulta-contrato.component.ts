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
import { ContentObserver } from '@angular/cdk/observers';

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

  constructor(
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private contratoMidService: ContratoGeneralMidService,
    private router: Router
  ) { }

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

  ngOnInit(): void {
    this.CargarunidadEjecutoraId();
    this.CargarVigencia();
    this.CargartipoContratoIds();
    this.CargarTipoPersona();
    this.consultar();
  }

  cambiarPagina(event: PageEvent) {
    this.paginaActual = event.pageIndex;
    this.tamanioPagina = event.pageSize;
    this.consultar();
  }

  consultar() {
    console.log("Se llama la función");
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

  verDetalle(contrato: ContratoGeneral) {
    this.router.navigate(['/detalle', contrato.id]);
  }

  private prepararParametros() {
    const formValues = this.form.value;
    const params: any = {};

    if (formValues.unidadEjecucion) params.unidadEjecucion = formValues.unidadEjecucion;
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

  CargarunidadEjecutoraId() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.UNIDAD_EJECUCION_ID + ',Id__in:166|180|181&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.unidadEjecucion = Response.Data;
      }
    })
  }

  CargarVigencia() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.VIGENCIA_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.vigencia = Response.Data;
      }
    })
  }

  CargartipoContratoIds() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_CONTRATO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.tipoContratoId = Response.Data;
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
