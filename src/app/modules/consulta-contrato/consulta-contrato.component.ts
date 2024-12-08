import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { Router } from "@angular/router";
import { ContratoGeneralMidService } from "../../services/contrato-general-mid.service";
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

    if (formValues.unidadEjecucion) params.unidadEjecucion = formValues.unidadEjecucion;
    if (formValues.vigencia) params.vigencia = formValues.vigencia;
    if (formValues.tipoContratoId) params.tipoContratoId = formValues.tipoContratoId;
    if (formValues.tipoPersona) {
      params.contratista = params.contratista || {};
      params.contratista.tipo_persona_id = formValues.tipoPersona;
    }
    if (formValues.contratista) {
      params.contratista = params.contratista || {};
      params.contratista.numero_documento = formValues.contratista;
    }
    if (formValues.numeroElaboracion) params.numeroElaboracion = formValues.numeroElaboracion;
    if (formValues.numeroContrato) params.id = formValues.numeroContrato;
    if (formValues.estado) {
      params.estados = params.estados || {};
      params.estados.estado_parametro_id = formValues.estado;
    }

    if (formValues.fechaDesde || formValues.fechaHasta) {
      params.fechaCreacion = {
        start: formValues.fechaDesde ? new Date(formValues.fechaDesde).toISOString().split('T')[0] : null,
        end: formValues.fechaHasta ? new Date(formValues.fechaHasta).toISOString().split('T')[0] : null
      };

      if (!params.fechaCreacion.start) delete params.fechaCreacion.start;
      if (!params.fechaCreacion.end) delete params.fechaCreacion.end;

      if (Object.keys(params.fechaCreacion).length === 0) {
        delete params.fechaCreacion;
      }
    }

    return params;
  }


  CargarunidadEjecutoraId() {
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

  CargarEstado() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.TIPO_ESTADO_ID + '&limit=0').subscribe((Response: any) => {
      if (Response.Status == "200") {
        this.estado = Response.Data;
      }
    })
  }

}
