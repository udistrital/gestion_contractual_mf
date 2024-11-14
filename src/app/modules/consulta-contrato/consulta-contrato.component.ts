import {Component, OnInit, ViewChild} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import {MatPaginator, PageEvent} from "@angular/material/paginator";
import {MatSort} from "@angular/material/sort";
import {MatTableDataSource} from "@angular/material/table";
import {ContratoGeneralCrudService} from "../../services/contrato-general-crud.service";
import {Router} from "@angular/router";

interface ContratoGeneral {
  id: number;
  vigencia: string;
  consecutivoElaboracion: string;
  valorPesos: string;
  fechaInicial: string;
  fechaFinal: string;
  plazoEjecucion: number;
  observaciones: string;
  activo: boolean;
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
    'id',
    'vigencia',
    'consecutivoElaboracion',
    'valorPesos',
    'fechaInicial',
    'fechaFinal',
    'plazoEjecucion',
    'observaciones',
    'activo',
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
    private contratoService: ContratoGeneralCrudService,
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
    this.CargarVigencia();
    this.CargarTipoPersona();
    this.consultar();
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

    this.contratoService.getContratos(params).subscribe({
      next: (response) => {
        if (response.Success && response.Status === 200) {
          this.dataSource.data = response.Data;
          this.totalRegistros = response.Metadata.total;
        }
      },
      error: (error) => {
        console.error('Error al consultar contratos:', error);
        // Aquí podrías agregar un snackbar o mensaje de error
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

    // Solo incluimos los parámetros que tienen valor
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
