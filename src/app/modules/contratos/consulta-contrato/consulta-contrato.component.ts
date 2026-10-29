import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { environment } from 'src/environments/environment';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { RolService } from 'src/app/services/rol.service';
import { ModalObservacionesComponent } from './modal-observaciones/modal-observaciones.component';
import { ModalSeleccionarUeComponent } from './modal-seleccionar-ue/modal-seleccionar-ue.component';
import { ModalValidarContratistaComponent } from './modal-validar-contratista/modal-validar-contratista.component';
import { MatDialog } from '@angular/material/dialog';
import { ContratoGeneral } from 'src/app/types/types';
import { accionesPorRolYEstado } from 'src/app/utils/accionesPorRolYEstado';
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter';
import {
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { AlertService } from 'src/app/services/alert.service';

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

export interface PestanaEstado {
  nombre: string;
  valor: string;
  count: number;
}

@Component({
  selector: 'app-consulta-contrato',
  templateUrl: './consulta-contrato.component.html',
  styleUrls: ['./consulta-contrato.component.css'],
  providers: [
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: FORMATO_LOCAL_FECHA },
  ],
  standalone: false
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

  // Control de Rol y Modo Pruebas
  rolActivo: 'JEFE' | 'ABOGADO' = 'JEFE';
  isProduction: boolean = environment.production;

  // Selector de Vigencia (Por defecto el año de la vigencia presente)
  vigenciaSeleccionada: string = new Date().getFullYear().toString();

  // Parámetros maestros
  unidadEjecutora: any[] = [];
  vigencia: any[] = [];
  tipoContratoId: any[] = [];
  tipoPersona: any[] = [];
  numeroElaboracion: any[] = [];
  numeroContrato: any[] = [];
  contratista: any[] = [];
  estado: any[] = [];
  fechaDesde: any[] = [];
  fechaHasta: any[] = [];

  // Control de colapso de filtros superiores
  filtrosExpandidos: boolean = false;

  // Pestañas superiores de estado con conteos (IDs numéricos de base de datos)
  estadoTabActivo: string = '';
  pestanasEstados: PestanaEstado[] = [
    { nombre: 'Todos', valor: '', count: 0 },
    {
      nombre: 'Por suscribir',
      valor: String(environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773),
      count: 0,
    },
    {
      nombre: 'Suscrito',
      valor: String(environment.ESTADOS_GENERALES?.SUSCRITO || 6774),
      count: 0,
    },
    {
      nombre: 'Declinado',
      valor: String(environment.ESTADOS_GENERALES?.DECLINADO || 6775),
      count: 0,
    },
    {
      nombre: 'Legalizado',
      valor: String(environment.ESTADOS_GENERALES?.LEGALIZADO || 6776),
      count: 0,
    },
    {
      nombre: 'En ejecución',
      valor: String(environment.ESTADOS_GENERALES?.EN_EJECUCION || 6777),
      count: 0,
    },
  ];

  // Columnas de la tabla (Incluye columna propia de estado con diseño de píldora)
  displayedColumns: string[] = [
    'numero_contrato',
    'vigencia',
    'tipoContratoId',
    'tipo_persona',
    'contratista',
    'valor_contrato',
    'unidadEjecutora',
    'estado',
    'fecha_registro',
    'fecha_aprobado',
    'acciones',
  ];

  constructor(
    private alertService: AlertService,
    public dialog: MatDialog,
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private contratoMidService: ContratoGeneralMidService,
    private rolService: RolService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  form = this._formBuilder.group({
    unidadEjecutora: [''],
    vigencia: [new Date().getFullYear().toString()],
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
    this.determinarRolInicial();
    this.CargarunidadEjecutoraId();
    this.CargarVigencia();
    this.CargartipoContratoIds();
    this.CargarTipoPersona();
    this.CargarEstado();

    this.form.get('fechaDesde')?.valueChanges.subscribe((value) => {
      if (value) {
        const fechaHasta = this.form.get('fechaHasta')?.value;
        if (fechaHasta && new Date(value) > new Date(fechaHasta)) {
          this.form.patchValue({
            fechaDesde: fechaHasta,
          });
        }
      }
    });

    this.form.get('fechaHasta')?.valueChanges.subscribe((value) => {
      if (value) {
        const fechaDesde = this.form.get('fechaDesde')?.value;
        if (fechaDesde && new Date(value) < new Date(fechaDesde)) {
          this.form.patchValue({
            fechaHasta: fechaDesde,
          });
        }
      }
    });

    this.consultar();
  }

  determinarRolInicial(): void {
    if (Array.isArray(this.roles) && this.roles.length > 0) {
      const esJefe = this.roles.some((r) =>
        r.includes('JEFE') || r === 'ADMIN_ARGO' || r.includes('ORDENADOR')
      );
      const esAbogado = this.roles.some((r) => r.includes('ABOGADO'));
      if (esAbogado && !esJefe) {
        this.rolActivo = 'ABOGADO';
      } else {
        this.rolActivo = 'JEFE';
      }
    } else {
      this.rolActivo = 'JEFE';
    }
  }

  cambiarRolPruebas(nuevoRol: 'JEFE' | 'ABOGADO'): void {
    this.rolActivo = nuevoRol;
    this.actualizarMetricasYAlertas();
  }

  onVigenciaChange(nuevaVigencia: string): void {
    this.vigenciaSeleccionada = nuevaVigencia;
    this.form.patchValue({ vigencia: nuevaVigencia });
    this.consultar();
  }

  seleccionarPestanaEstado(valorEstado: string): void {
    this.estadoTabActivo = valorEstado;
    this.form.patchValue({ estado: valorEstado });
    this.consultar();
  }

  // Modales interactivas
  abrirModalCrearContrato(): void {
    const dialogRef = this.dialog.open(ModalSeleccionarUeComponent, {
      width: '560px',
      maxWidth: '92vw',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((unidadEjecutora) => {
      if (unidadEjecutora) {
        // Al seleccionar la UE y presionar 'Validar contratista', se abre la validación
        const dialogValidar = this.dialog.open(ModalValidarContratistaComponent, {
          width: '740px',
          maxWidth: '92vw',
          disableClose: false,
          data: { unidadEjecutora },
        });

        dialogValidar.afterClosed().subscribe((res) => {
          if (res && res.contratista) {
            this.router.navigate(['registrar'], {
              relativeTo: this.route.parent,
              state: {
                unidadEjecutora: unidadEjecutora.codigo,
                unidadEjecutoraId: unidadEjecutora.id,
                unidadEjecutoraNombre: unidadEjecutora.nombre,
                contratistaPrevalidado: res.contratista,
                bloquearContratista: true,
              },
            });
          }
        });
      }
    });
  }

  abrirModalValidarContratista(): void {
    const dialogRef = this.dialog.open(ModalValidarContratistaComponent, {
      width: '740px',
      maxWidth: '92vw',
      disableClose: false,
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res && res.contratista) {
        if (res.unidadEjecutora) {
          this.router.navigate(['registrar'], {
            relativeTo: this.route.parent,
            state: {
              unidadEjecutora: res.unidadEjecutora.codigo,
              unidadEjecutoraId: res.unidadEjecutora.id,
              unidadEjecutoraNombre: res.unidadEjecutora.nombre,
              contratistaPrevalidado: res.contratista,
              bloquearContratista: true,
            },
          });
        } else {
          // Si no se había seleccionado la Unidad Ejecutora, la solicita antes de registrar
          const dialogUe = this.dialog.open(ModalSeleccionarUeComponent, {
            width: '560px',
            maxWidth: '92vw',
          });

          dialogUe.afterClosed().subscribe((ue) => {
            if (ue) {
              this.router.navigate(['registrar'], {
                relativeTo: this.route.parent,
                state: {
                  unidadEjecutora: ue.codigo,
                  unidadEjecutoraId: ue.id,
                  unidadEjecutoraNombre: ue.nombre,
                  contratistaPrevalidado: res.contratista,
                  bloquearContratista: true,
                },
              });
            }
          });
        }
      }
    });
  }

  // Ayudante de clases de color para la píldora de estado (Estilos refinados con dot)
  getEstadoBadgeClass(contrato: ContratoGeneral): string {
    const estadoParamId =
      contrato?.estados?.estado_parametro_id ||
      (contrato as any)?.estado ||
      (contrato as any)?.estado_id;

    const idStr = String(estadoParamId);
    if (idStr === String(environment.ESTADOS_GENERALES?.EN_EJECUCION || 6777)) {
      return 'status-ejecucion';
    }
    if (idStr === String(environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773)) {
      return 'status-suscribir';
    }
    if (idStr === String(environment.ESTADOS_GENERALES?.SUSCRITO || 6774)) {
      return 'status-suscrito';
    }
    if (idStr === String(environment.ESTADOS_GENERALES?.LEGALIZADO || 6776)) {
      return 'status-legalizado';
    }
    if (idStr === String(environment.ESTADOS_GENERALES?.DECLINADO || 6775)) {
      return 'status-declinado';
    }

    const estadoNombre = (
      contrato?.estados?.nombre_estado ||
      contrato?.estados?.estado_nombre ||
      this.getEstadoNombre(contrato) ||
      ''
    )
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (estadoNombre.includes('ejecucion') || estadoNombre.includes('activo')) {
      return 'status-ejecucion';
    }
    if (
      estadoNombre.includes('suscribir') ||
      estadoNombre.includes('revision') ||
      estadoNombre.includes('pendiente')
    ) {
      return 'status-suscribir';
    }
    if (estadoNombre.includes('suscrito')) {
      return 'status-suscrito';
    }
    if (
      estadoNombre.includes('legalizado') ||
      estadoNombre.includes('perfeccionado')
    ) {
      return 'status-legalizado';
    }
    if (
      estadoNombre.includes('declinado') ||
      estadoNombre.includes('cancelado') ||
      estadoNombre.includes('rechazado')
    ) {
      return 'status-declinado';
    }
    return 'status-borrador';
  }

  getEstadoNombre(contrato: ContratoGeneral): string {
    const rawNombre =
      contrato?.estados?.nombre_estado ||
      contrato?.estados?.estado_nombre ||
      (contrato as any)?.estado_nombre;

    if (rawNombre && isNaN(Number(rawNombre))) {
      return this.capitalizarTexto(rawNombre);
    }

    const estadoParamId =
      contrato?.estados?.estado_parametro_id ||
      (contrato as any)?.estado ||
      (contrato as any)?.estado_id;

    if (estadoParamId !== undefined && estadoParamId !== null && estadoParamId !== '') {
      if (this.estado && this.estado.length > 0) {
        const encontrado = this.estado.find((e) => String(e.Id) === String(estadoParamId));
        if (encontrado?.Nombre) return this.capitalizarTexto(encontrado.Nombre);
      }

      const idStr = String(estadoParamId);
      if (idStr === String(environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773)) return 'Por suscribir';
      if (idStr === String(environment.ESTADOS_GENERALES?.SUSCRITO || 6774)) return 'Suscrito';
      if (idStr === String(environment.ESTADOS_GENERALES?.DECLINADO || 6775)) return 'Declinado';
      if (idStr === String(environment.ESTADOS_GENERALES?.LEGALIZADO || 6776)) return 'Legalizado';
      if (idStr === String(environment.ESTADOS_GENERALES?.EN_EJECUCION || 6777)) return 'En ejecución';
    }

    return 'Sin estado';
  }

  private capitalizarTexto(texto: string): string {
    if (!texto) return '';
    const str = String(texto).trim();
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  getNombreTipoContrato(tipoId: any): string {
    if (!tipoId && tipoId !== 0) return 'N/A';
    if (this.tipoContratoId && this.tipoContratoId.length > 0) {
      const match = this.tipoContratoId.find(
        (t) => String(t.Id) === String(tipoId) || String(t.Nombre) === String(tipoId)
      );
      if (match) return match.Nombre;
    }
    return String(tipoId);
  }

  getTipoPersona(row: any): string {
    const tipo =
      row?.contratista?.tipo_persona_id ||
      row?.contratista?.tipo_persona ||
      row?.tipo_persona_id ||
      row?.tipo_persona;
    if (!tipo) return 'N/A';
    if (this.tipoPersona && this.tipoPersona.length > 0) {
      const match = this.tipoPersona.find(
        (p) => String(p.Id) === String(tipo) || String(p.Nombre) === String(tipo)
      );
      if (match) return match.Nombre;
    }
    return String(tipo);
  }

  getNombreContratista(row: any): string {
    if (!row?.contratista) return 'N/A';
    const c = row.contratista;
    const nombre = c.nombre || c.NombreCompleto || c.nom_proveedor || c.razon_social;
    return nombre ? String(nombre).trim() : 'N/A';
  }

  getDocumentoContratista(row: any): string | null {
    if (!row?.contratista) return null;
    const c = row.contratista;
    return c.numero_documento || c.num_documento || c.identificacion || null;
  }

  getValorContrato(row: any): string {
    const rawVal =
      row?.valor_pesos ??
      row?.valor_contrato_me ??
      row?.valor ??
      row?.valor_contrato ??
      row?.valorTotal;

    if (rawVal === undefined || rawVal === null || rawVal === '' || isNaN(Number(rawVal))) {
      return 'N/A';
    }

    const num = Number(rawVal);
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return `$ ${num.toLocaleString('es-CO')}`;
    }
  }

  getNombreUnidadEjecutora(ueId: any): string {
    if (!ueId) return '01 - Rectoría';
    const match = this.unidadEjecutora?.find((u) => String(u.Id) === String(ueId));
    if (match) return match.Nombre;
    return String(ueId) === '2' ? '02 - IDEXUD' : '01 - Rectoría';
  }

  getAccionesPorRolYEstado(contrato: ContratoGeneral): string[] {
    const estado = contrato.estados?.estado_interno_parametro_id;
    const accionesSet = new Set<string>();
    this.roles.forEach((rol) => {
      const acciones = accionesPorRolYEstado[rol]?.[estado];
      if (acciones) {
        acciones.forEach((accion: any) => accionesSet.add(accion));
      }
    });

    // Fallback por defecto si no vienen configuradas por rol
    if (accionesSet.size === 0) {
      accionesSet.add('Ver Contrato');
      accionesSet.add('Ver Historial');
    }

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
    return iconos[accion] || 'help';
  }

  realizarAccion(contrato: ContratoGeneral, accion: string) {
    switch (accion) {
      case 'Ver Contrato':
        this.router.navigate(['registrar']);
        break;
      case 'Editar Contrato':
        this.router.navigate(['editar', contrato.id], { relativeTo: this.route.parent });
        break;
      case 'Enviar Aprobación Jefe OC':
        this.alertService.showSuccessAlert('Contrato enviado para aprobación de Jefatura');
        break;
      case 'Ver Historial':
        this.openModalObservaciones(contrato.id!);
        break;
      case 'Declinar':
        this.alertService.showErrorAlert('Trámite de contrato declinado');
        break;
      case 'Revisar Contrato':
      case 'Ver Documentos':
        this.router.navigate(['documentos', contrato.id], { relativeTo: this.route.parent });
        break;
      default:
        break;
    }
  }

  openModalObservaciones(idContrato: number): void {
    this.dialog.open(ModalObservacionesComponent, {
      width: '70vw',
      maxHeight: '35vw',
      data: { idContrato },
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
        if (response && response.Success && (response.Status === 200 || response.Status == '200')) {
          this.dataSource.data = response.Data || [];
          this.totalRegistros = response.Metadata?.total || (response.Data ? response.Data.length : 0);
          this.actualizarMetricasYAlertas();
        } else if (response && response.Data && Array.isArray(response.Data)) {
          this.dataSource.data = response.Data;
          this.totalRegistros = response.Metadata?.total ?? response.Data.length;
          this.actualizarMetricasYAlertas();
        } else if (Array.isArray(response)) {
          this.dataSource.data = response;
          this.totalRegistros = response.length;
          this.actualizarMetricasYAlertas();
        } else {
          this.dataSource.data = [];
          this.totalRegistros = 0;
          this.actualizarMetricasYAlertas();
        }
      },
      error: async () => {
        this.isLoading = false;
        await this.alertService.showErrorAlert('Error al consultar contratos');
      },
      complete: () => {
        this.isLoading = false;
      },
    });
  }

  private actualizarMetricasYAlertas(): void {
    const data = this.dataSource.data || [];

    let countPorSuscribir = 0;
    let countSuscrito = 0;
    let countLegalizado = 0;
    let countEjecucion = 0;
    let countDeclinado = 0;

    data.forEach((c) => {
      const cls = this.getEstadoBadgeClass(c);
      if (cls === 'status-suscribir') countPorSuscribir++;
      else if (cls === 'status-suscrito') countSuscrito++;
      else if (cls === 'status-legalizado') countLegalizado++;
      else if (cls === 'status-ejecucion') countEjecucion++;
      else if (cls === 'status-declinado') countDeclinado++;
    });

    // Pestañas
    this.pestanasEstados.forEach((p) => {
      if (p.nombre === 'Todos') p.count = this.totalRegistros;
      else if (p.nombre === 'Por suscribir') p.count = countPorSuscribir;
      else if (p.nombre === 'Suscrito') p.count = countSuscrito;
      else if (p.nombre === 'Declinado') p.count = countDeclinado;
      else if (p.nombre === 'Legalizado') p.count = countLegalizado;
      else if (p.nombre === 'En ejecución') p.count = countEjecucion;
    });
  }

  limpiarFiltros() {
    this.vigenciaSeleccionada = new Date().getFullYear().toString();
    this.form.reset({
      vigencia: this.vigenciaSeleccionada,
    });
    this.estadoTabActivo = '';
    this.paginaActual = 0;
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.consultar();
  }

  toggleFiltros(): void {
    this.filtrosExpandidos = !this.filtrosExpandidos;
  }

  hayFiltrosActivos(): boolean {
    const v = this.form.value;
    return Boolean(
      (this.vigenciaSeleccionada && this.vigenciaSeleccionada !== '') ||
      v.vigencia ||
      v.unidadEjecutora ||
      v.tipoContratoId ||
      v.tipoPersona ||
      v.numeroElaboracion ||
      v.numeroContrato ||
      v.contratista ||
      v.fechaDesde ||
      v.fechaHasta
    );
  }

  getResumenFiltrosActivos(): string {
    const v = this.form.value;
    const activos: string[] = [];

    const vig = v.vigencia || this.vigenciaSeleccionada;
    if (vig) activos.push(`Vigencia: ${vig}`);
    if (v.unidadEjecutora) {
      const ue = this.unidadEjecutora.find((u) => String(u.Id) === String(v.unidadEjecutora));
      activos.push(`UE: ${ue?.Nombre || v.unidadEjecutora}`);
    }
    if (v.tipoContratoId) {
      const tc = this.tipoContratoId.find((t) => String(t.Id) === String(v.tipoContratoId));
      activos.push(`Tipo: ${tc?.Nombre || v.tipoContratoId}`);
    }
    if (v.contratista) activos.push(`Contratista: ${v.contratista}`);
    if (v.numeroContrato) activos.push(`No: ${v.numeroContrato}`);

    if (activos.length === 0) {
      return 'Haga clic para desplegar filtros por vigencia, unidad ejecutora, fechas o contratista';
    }
    return `${activos.length} filtro(s) activo(s): ${activos.join(' • ')}`;
  }

  private prepararParametros() {
    const formValues = this.form.value;
    const params: any = {
      limit: this.tamanioPagina,
      offset: this.paginaActual * this.tamanioPagina,
    };

    if (formValues.unidadEjecutora && formValues.unidadEjecutora.toString().trim() !== '') {
      params.unidad_ejecutora_id = formValues.unidadEjecutora;
    }

    const vigenciaVal = (formValues.vigencia || this.vigenciaSeleccionada || '').toString().trim();
    if (vigenciaVal !== '') {
      params.vigencia = vigenciaVal;
    }

    if (formValues.tipoContratoId && formValues.tipoContratoId.toString().trim() !== '') {
      params.tipoContratoId = formValues.tipoContratoId;
    }
    if (formValues.tipoPersona && formValues.tipoPersona.toString().trim() !== '') {
      params.contratista = params.contratista || {};
      params.contratista.tipo_persona_id = formValues.tipoPersona;
    }
    if (formValues.contratista && formValues.contratista.toString().trim() !== '') {
      params.contratista = params.contratista || {};
      params.contratista.numero_documento = formValues.contratista;
    }
    if (formValues.numeroElaboracion && formValues.numeroElaboracion.toString().trim() !== '') {
      params.numeroElaboracion = formValues.numeroElaboracion;
    }
    if (formValues.numeroContrato && formValues.numeroContrato.toString().trim() !== '') {
      params.id = formValues.numeroContrato;
    }

    const estadoParam = (this.estadoTabActivo || formValues.estado || '').toString().trim();
    if (estadoParam !== '') {
      let estadoId: number | null = null;
      if (!isNaN(Number(estadoParam))) {
        estadoId = Number(estadoParam);
      } else {
        const encontrado = this.estado.find(
          (e) => e.Nombre?.toLowerCase() === estadoParam.toLowerCase()
        );
        if (encontrado) {
          estadoId = Number(encontrado.Id);
        } else {
          const mapaEstados: { [key: string]: number } = {
            'por suscribir': environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773,
            'suscrito': environment.ESTADOS_GENERALES?.SUSCRITO || 6774,
            'declinado': environment.ESTADOS_GENERALES?.DECLINADO || 6775,
            'legalizado': environment.ESTADOS_GENERALES?.LEGALIZADO || 6776,
            'en ejecución': environment.ESTADOS_GENERALES?.EN_EJECUCION || 6777,
            'en ejecucion': environment.ESTADOS_GENERALES?.EN_EJECUCION || 6777,
          };
          estadoId = mapaEstados[estadoParam.toLowerCase()] || null;
        }
      }

      if (estadoId !== null && !isNaN(estadoId)) {
        params.estados = params.estados || {};
        params.estados.estado_parametro_id = estadoId;
      }
    }

    if (formValues.fechaDesde || formValues.fechaHasta) {
      params.fechaCreacion = {};

      if (formValues.fechaDesde) {
        params.fechaCreacion.start = new Date(formValues.fechaDesde)
          .toISOString()
          .split('T')[0];
      }

      if (formValues.fechaHasta) {
        params.fechaCreacion.end = new Date(formValues.fechaHasta)
          .toISOString()
          .split('T')[0];
      }
    }
    return params;
  }

  CargarunidadEjecutoraId() {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.UNIDAD_EJECUTORA_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((Response: any) => {
        if (Response?.Status == '200') {
          this.unidadEjecutora = Response.Data || [];
        }
      });
  }

  CargarVigencia() {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.VIGENCIA_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((Response: any) => {
        if (Response?.Status == '200') {
          this.vigencia = Response.Data || [];
        }
      });
  }

  CargartipoContratoIds() {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.TIPO_CONTRATO_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((Response: any) => {
        if (Response?.Status == '200') {
          this.tipoContratoId = Response.Data || [];
        }
      });
  }

  CargarTipoPersona() {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.TIPO_PERSONA_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((Response: any) => {
        if (Response?.Status == '200') {
          this.tipoPersona = Response.Data || [];
        }
      });
  }

  CargarEstado() {
    this.parametrosService
      .get(
        `parametro?query=TipoParametroId:${environment.TIPO_ESTADO_ID},Activo:true&limit=0&sortby=nombre&order=asc&fields=Id,Nombre`
      )
      .subscribe((Response: any) => {
        if (Response?.Status == '200') {
          this.estado = Response.Data || [];
        }
      });
  }
}
