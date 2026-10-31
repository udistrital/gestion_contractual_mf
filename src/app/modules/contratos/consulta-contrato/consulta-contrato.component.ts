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
import {
  ModalEnviarAprobacionComponent,
  ModalEnviarAprobacionResultado,
} from './modal-enviar-aprobacion/modal-enviar-aprobacion.component';
import {
  ModalAprobacionMasivaComponent,
  ModalAprobacionMasivaResultado,
} from './modal-aprobacion-masiva/modal-aprobacion-masiva.component';
import {
  ModalRechazoMasivoComponent,
  ModalRechazoMasivoResultado,
} from './modal-rechazo-masivo/modal-rechazo-masivo.component';
import { SelectionModel } from '@angular/cdk/collections';
import { MatDialog } from '@angular/material/dialog';
import { ContratoGeneral, EstadoContrato, ParametroResponse } from 'src/app/types/types';
import { accionesPorRolYEstado } from 'src/app/utils/accionesPorRolYEstado';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { UserService } from 'src/app/services/user.service';
import { forkJoin } from 'rxjs';
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
  usuarioId: number = 1;

  // Control de Rol y Modo Pruebas
  rolActivo: 'JEFE' | 'ABOGADO' = 'JEFE';
  isProduction: boolean = environment.production;

  // Selector de Vigencia (Por defecto el año de la vigencia presente)
  vigenciaSeleccionada: string = new Date().getFullYear().toString();

  // Tipos de parámetros requeridos para la consulta y filtros
  tiposParametrosRequeridos: number[] = [
    environment.UNIDAD_EJECUTORA_ID,
    environment.VIGENCIA_ID,
    environment.TIPO_CONTRATO_ID,
    environment.TIPO_PERSONA_ID,
    environment.TIPO_ESTADO_ID,
  ];

  // Parámetros maestros
  unidadEjecutora: ParametroResponse[] = [];
  vigencia: ParametroResponse[] = [];
  tipoContratoId: ParametroResponse[] = [];
  tipoPersona: ParametroResponse[] = [];
  numeroElaboracion: any[] = [];
  numeroContrato: any[] = [];
  contratista: any[] = [];
  estado: ParametroResponse[] = [];
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

  // Selección múltiple para aprobación/rechazo masivo del Jefe de Contratación
  seleccionContratos = new SelectionModel<ContratoGeneral>(true, []);

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

  get columnasVisibles(): string[] {
    if (this.rolActivo === 'JEFE') {
      return ['select', ...this.displayedColumns];
    }
    return this.displayedColumns;
  }

  constructor(
    private alertService: AlertService,
    public dialog: MatDialog,
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private contratoMidService: ContratoGeneralMidService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private userService: UserService,
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

  async ngOnInit(): Promise<void> {
    try {
      if (!this.rolService.getRol() || this.rolService.getRol().length === 0) {
        await this.rolService.cargarRol();
      }
    } catch {
      // Ignorar fallback en pruebas
    }
    try {
      this.userService.getPersonaId().then((id) => {
        if (id) this.usuarioId = id;
      });
    } catch {
      // Ignorar fallback en pruebas
    }
    this.roles = this.rolService.getRol();
    this.determinarRolInicial();
    await this.loadInitialData();

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
    this.seleccionContratos.clear();
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

  // Obtiene el identificador de estado interno del contrato a partir de estado_interno_parametro_id
  getEstadoInternoId(contrato: ContratoGeneral): number | undefined {
    const raw =
      contrato?.estados?.estado_interno_parametro_id ??
      (Array.isArray(contrato?.estados) ? contrato.estados[0]?.estado_interno_parametro_id : undefined) ??
      (contrato as any)?.estado_interno_parametro_id;

    if (raw !== undefined && raw !== null && !isNaN(Number(raw)) && Number(raw) > 0) {
      return Number(raw);
    }

    return undefined;
  }

  // Ayudante de clases de color para la píldora de estado (Estilos refinados con dot)
  getEstadoBadgeClass(contrato: ContratoGeneral): string {
    const estadoInternoId = this.getEstadoInternoId(contrato);
    if (estadoInternoId === environment.ESTADOS_INTERNOS.APROBADO_JEFE) {
      return 'status-vobo';
    }
    if (estadoInternoId === environment.ESTADOS_INTERNOS.EN_REVISION_JEFE) {
      return 'status-por-aprobar';
    }
    if (estadoInternoId === environment.ESTADOS_INTERNOS.RECHAZADO) {
      return 'status-rechazado';
    }
    if (estadoInternoId === environment.ESTADOS_INTERNOS.BORRADOR) {
      return 'status-borrador';
    }

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
    const estadoInternoId = this.getEstadoInternoId(contrato);
    if (estadoInternoId === environment.ESTADOS_INTERNOS.APROBADO_JEFE) {
      return 'VoBo Jefatura';
    }
    if (estadoInternoId === environment.ESTADOS_INTERNOS.EN_REVISION_JEFE) {
      return 'Por aprobar';
    }
    if (estadoInternoId === environment.ESTADOS_INTERNOS.RECHAZADO) {
      return 'Rechazado';
    }
    if (estadoInternoId === environment.ESTADOS_INTERNOS.BORRADOR) {
      return 'Borrador';
    }

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

  tieneVoBoJefatura(contrato: ContratoGeneral): boolean {
    return this.getEstadoInternoId(contrato) === environment.ESTADOS_INTERNOS.APROBADO_JEFE;
  }

  esContratoRechazado(contrato: ContratoGeneral): boolean {
    return this.getEstadoInternoId(contrato) === environment.ESTADOS_INTERNOS.RECHAZADO;
  }

  esContratoPorAprobar(contrato: ContratoGeneral): boolean {
    return this.getEstadoInternoId(contrato) === environment.ESTADOS_INTERNOS.EN_REVISION_JEFE;
  }

  get contratosPorAprobarVisibles(): ContratoGeneral[] {
    return (this.dataSource.data || []).filter((c) => this.esContratoPorAprobar(c));
  }

  estanTodosSeleccionados(): boolean {
    const numSeleccionados = this.seleccionContratos.selected.length;
    const numPorAprobar = this.contratosPorAprobarVisibles.length;
    return numPorAprobar > 0 && numSeleccionados === numPorAprobar;
  }

  toggleTodosLosContratos(): void {
    if (this.estanTodosSeleccionados()) {
      this.seleccionContratos.clear();
      return;
    }
    this.contratosPorAprobarVisibles.forEach((row) => this.seleccionContratos.select(row));
  }

  get valorTotalSeleccionado(): number {
    return this.seleccionContratos.selected.reduce(
      (acc, c) => acc + (Number(c.valor_pesos) || 0),
      0
    );
  }

  get valorTotalSeleccionadoFormateado(): string {
    try {
      return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(this.valorTotalSeleccionado);
    } catch {
      return `$ ${this.valorTotalSeleccionado.toLocaleString('es-CO')}`;
    }
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
    const estado = this.getEstadoInternoId(contrato) ?? environment.ESTADOS_INTERNOS.BORRADOR;
    const accionesSet = new Set<string>();

    let rolesAEvaluar: string[] = [];

    if (this.rolActivo === 'ABOGADO') {
      const rolesAbogado = (this.roles || []).filter((r) => r.includes('ABOGADO'));
      rolesAEvaluar = rolesAbogado.length > 0 ? rolesAbogado : ['ABOGADO_CONTRATACION_RECTOR'];
    } else {
      const rolesJefe = (this.roles || []).filter(
        (r) => r.includes('JEFE') || r === 'ADMIN_ARGO' || r.includes('ORDENADOR')
      );
      rolesAEvaluar = rolesJefe.length > 0 ? rolesJefe : ['JEFE_CONTRATACION_RECTOR'];
    }

    rolesAEvaluar.forEach((rol) => {
      const acciones = accionesPorRolYEstado[rol]?.[estado];
      if (acciones && acciones.length > 0) {
        acciones.forEach((accion: any) => accionesSet.add(accion));
      }
    });

    // En rol Abogado, garantizar edición y envío a revisión para contratos en Borrador y Rechazado
    if (this.rolActivo === 'ABOGADO') {
      if (
        estado === environment.ESTADOS_INTERNOS.BORRADOR ||
        estado === environment.ESTADOS_INTERNOS.RECHAZADO
      ) {
        accionesSet.add('Editar Contrato');
        accionesSet.add('Enviar Aprobación Jefe OC');
      }
      accionesSet.add('Ver Contrato');
      accionesSet.add('Ver Detalle');
      accionesSet.add('Ver Historial');
    }

    // En rol Jefe, para contratos por aprobar incluir Revisar Contrato
    if (this.rolActivo === 'JEFE') {
      if (estado === environment.ESTADOS_INTERNOS.EN_REVISION_JEFE) {
        accionesSet.add('Revisar Contrato');
      }
      accionesSet.add('Ver Contrato');
      accionesSet.add('Ver Detalle');
      accionesSet.add('Ver Historial');
    }

    // Fallback por defecto si no vienen configuradas por rol
    if (accionesSet.size === 0) {
      accionesSet.add('Ver Contrato');
      accionesSet.add('Ver Detalle');
      accionesSet.add('Ver Historial');
    }

    return Array.from(accionesSet);
  }

  getIconoAccion(accion: string): string {
    const iconos: { [key: string]: string } = {
      'Ver Contrato': 'visibility',
      'Ver Detalle': 'article',
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
      case 'Revisar Contrato':
      case 'Ver Documentos': {
        const docBase = this.router.url.includes('gestion-contractual')
          ? '/gestion-contractual/contratos/documentos'
          : '/contratos/documentos';
        this.router.navigate([docBase, contrato.id]);
        break;
      }
      case 'Ver Detalle': {
        const detalleBase = this.router.url.includes('gestion-contractual')
          ? '/gestion-contractual/contratos/detalle'
          : '/contratos/detalle';
        this.router.navigate([detalleBase, contrato.id]);
        break;
      }
      case 'Editar Contrato': {
        const editBase = this.router.url.includes('gestion-contractual')
          ? '/gestion-contractual/contratos/editar'
          : '/contratos/editar';
        this.router.navigate([editBase, contrato.id]);
        break;
      }
      case 'Enviar Aprobación Jefe OC':
        this.abrirModalEnviarAprobacion(contrato);
        break;
      case 'Ver Historial':
        this.openModalObservaciones(contrato.id!);
        break;
      case 'Declinar':
        this.alertService.showErrorAlert('Trámite de contrato declinado');
        break;
      default:
        break;
    }
  }

  abrirModalEnviarAprobacion(contrato: ContratoGeneral): void {
    const dialogRef = this.dialog.open(ModalEnviarAprobacionComponent, {
      width: '640px',
      maxWidth: '92vw',
      disableClose: false,
      data: { contrato },
    });

    dialogRef.afterClosed().subscribe((res: ModalEnviarAprobacionResultado) => {
      if (res && res.confirmado) {
        const rolUsuario =
          (this.roles || []).find((r) => r.includes('ABOGADO')) ||
          (this.rolActivo === 'ABOGADO'
            ? 'ABOGADO_CONTRATACION_RECTOR'
            : 'JEFE_CONTRATACION_RECTOR');

        const nuevoEstado: EstadoContrato = {
          contrato_general_id: contrato.id as number,
          usuario_id: this.usuarioId || 1,
          usuario_rol: rolUsuario,
          estado_parametro_id:
            environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773,
          estado_interno_parametro_id:
            environment.ESTADOS_INTERNOS.EN_REVISION_JEFE,
          motivo: res.observacion || 'Envío a revisión y aprobación de Jefatura',
        };

        this.contratoGeneralCrudService.postEstadoContrato(nuevoEstado).subscribe({
          next: () => {
            if (!contrato.estados) {
              contrato.estados = {};
            }
            contrato.estados.estado_interno_parametro_id =
              environment.ESTADOS_INTERNOS.EN_REVISION_JEFE;
            contrato.estados.nombre_estado = 'Por aprobar';
            if (res.observacion) {
              contrato.observaciones = res.observacion;
            }
            this.actualizarMetricasYAlertas();
            this.alertService.showSuccessAlert(
              'El contrato fue enviado para aprobación de la Jefatura con éxito.'
            );
          },
          error: (err) => {
            console.error('Error al persistir estado en backend:', err);
            this.alertService.showErrorAlert(
              'No fue posible enviar el contrato para aprobación.'
            );
          },
        });
      }
    });
  }

  abrirModalAprobacionMasiva(): void {
    const seleccionados = [...this.seleccionContratos.selected];
    if (seleccionados.length === 0) return;

    const dialogRef = this.dialog.open(ModalAprobacionMasivaComponent, {
      width: '780px',
      maxWidth: '94vw',
      disableClose: false,
      data: { contratos: seleccionados },
    });

    dialogRef.afterClosed().subscribe((res: ModalAprobacionMasivaResultado) => {
      if (res && res.confirmado) {
        const rolUsuario =
          (this.roles || []).find((r) => r.includes('JEFE')) ||
          'JEFE_CONTRATACION_RECTOR';

        const peticiones = seleccionados.map((c) => {
          const nuevoEstado: EstadoContrato = {
            contrato_general_id: c.id as number,
            usuario_id: this.usuarioId || 1,
            usuario_rol: rolUsuario,
            estado_parametro_id:
              environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773,
            estado_interno_parametro_id:
              environment.ESTADOS_INTERNOS.APROBADO_JEFE,
            motivo: res.observacion || 'Aprobación oficial con VoBo de Jefatura',
          };
          return this.contratoGeneralCrudService.postEstadoContrato(nuevoEstado);
        });

        forkJoin(peticiones).subscribe({
          next: () => {
            seleccionados.forEach((c) => {
              if (!c.estados) c.estados = {};
              c.estados.estado_interno_parametro_id =
                environment.ESTADOS_INTERNOS.APROBADO_JEFE;
              c.estados.nombre_estado = 'VoBo Jefatura';
              (c as any).fecha_aprobado = new Date();
              if (res.observacion) {
                c.observaciones = res.observacion;
              }
            });

            this.seleccionContratos.clear();
            this.actualizarMetricasYAlertas();
            this.alertService.showSuccessAlert(
              `Se ha registrado el VoBo oficial para ${seleccionados.length} contrato(s) satisfactoriamente.`
            );
            this.consultar(false);
          },
          error: (err) => {
            console.error('Error al persistir aprobación masiva:', err);
            this.alertService.showErrorAlert(
              'Ocurrió un error al registrar la aprobación masiva de contratos.'
            );
            this.consultar(false);
          },
        });
      }
    });
  }

  abrirModalRechazoMasivo(): void {
    const seleccionados = [...this.seleccionContratos.selected];
    if (seleccionados.length === 0) return;

    const dialogRef = this.dialog.open(ModalRechazoMasivoComponent, {
      width: '720px',
      maxWidth: '92vw',
      disableClose: false,
      data: { contratos: seleccionados },
    });

    dialogRef.afterClosed().subscribe((res: ModalRechazoMasivoResultado) => {
      if (res && res.confirmado) {
        const rolUsuario =
          (this.roles || []).find((r) => r.includes('JEFE')) ||
          'JEFE_CONTRATACION_RECTOR';

        const peticiones = seleccionados.map((c) => {
          const motivoContrato =
            (res.tipoObservacion === 'individual' &&
              res.motivosPorContrato &&
              c.id &&
              res.motivosPorContrato[c.id]?.trim()) ||
            res.motivoGeneral?.trim() ||
            res.motivo?.trim() ||
            'Rechazo de contrato por Jefatura';

          const nuevoEstado: EstadoContrato = {
            contrato_general_id: c.id as number,
            usuario_id: this.usuarioId || 1,
            usuario_rol: rolUsuario,
            estado_parametro_id:
              environment.ESTADOS_GENERALES?.POR_SUSCRIBIR || 6773,
            estado_interno_parametro_id:
              environment.ESTADOS_INTERNOS.RECHAZADO,
            motivo: motivoContrato,
          };
          return this.contratoGeneralCrudService.postEstadoContrato(nuevoEstado);
        });

        forkJoin(peticiones).subscribe({
          next: () => {
            seleccionados.forEach((c) => {
              if (!c.estados) c.estados = {};
              c.estados.estado_interno_parametro_id =
                environment.ESTADOS_INTERNOS.RECHAZADO;
              c.estados.nombre_estado = 'Rechazado';
              const motivoContrato =
                (res.tipoObservacion === 'individual' &&
                  res.motivosPorContrato &&
                  c.id &&
                  res.motivosPorContrato[c.id]?.trim()) ||
                res.motivoGeneral?.trim() ||
                res.motivo?.trim() ||
                '';
              c.observaciones = motivoContrato;
            });

            this.seleccionContratos.clear();
            this.actualizarMetricasYAlertas();
            this.alertService.showSuccessAlert(
              `Se devolvieron ${seleccionados.length} contrato(s) con las observaciones de rechazo.`
            );
            this.consultar(false);
          },
          error: (err) => {
            console.error('Error al persistir rechazo masivo:', err);
            this.alertService.showErrorAlert(
              'Ocurrió un error al registrar el rechazo masivo de contratos.'
            );
            this.consultar(false);
          },
        });
      }
    });
  }

  openModalObservaciones(idContrato: number): void {
    this.dialog.open(ModalObservacionesComponent, {
      width: '70vw',
      maxHeight: '35vw',
      data: { idContrato },
    });
  }

  cambiarPagina(event: PageEvent) {
    this.seleccionContratos.clear();
    this.paginaActual = event.pageIndex;
    this.tamanioPagina = event.pageSize;
    this.consultar(false);
  }

  consultar(resetPage: boolean = true) {
    this.seleccionContratos.clear();
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

  private async loadInitialData(): Promise<void> {
    return this.parametrosService
      .getParametrosPorTipo(this.tiposParametrosRequeridos)
      .then((data: Record<number, ParametroResponse[]>) => {
        this.unidadEjecutora = data[environment.UNIDAD_EJECUTORA_ID] || [];
        this.vigencia = (data[environment.VIGENCIA_ID] || []).sort((a, b) =>
          (b.Nombre || '').localeCompare(a.Nombre || '')
        );
        this.tipoContratoId = data[environment.TIPO_CONTRATO_ID] || [];
        this.tipoPersona = data[environment.TIPO_PERSONA_ID] || [];
        this.estado = data[environment.TIPO_ESTADO_ID] || [];
      })
      .catch((error: any) => {
        this.handleError(error);
      });
  }

  private handleError(error: any): void {
    this.alertService.showErrorAlert(
      'Ocurrió un error al cargar los datos iniciales',
      'Error al cargar los datos iniciales'
    );
  }
}
