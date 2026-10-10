import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';
import { ContratoGeneralMidService } from 'src/app/services/contrato-general-mid.service';
import { ProveedoresService } from 'src/app/services/proveedores.service';
import { UserService } from 'src/app/services/user.service';
import { abrirVentanaPdf, mostrarPdfEnVentana } from 'src/app/utils/visor-pdf';
import { RegistroActasService } from './registro-actas.service';

// Roles que pueden registrar el acta de inicio (los mismos de minuta_contractual_mid)
const ROLES_ACTA_INICIO = ['ABOGADO_CONTRATACION_RECTOR', 'ABOGADO_CONTRATACION_IDEXUD', 'CONTRATISTA'];

@Component({
  selector: 'app-registro-actas',
  templateUrl: './registro-actas.component.html',
  styleUrls: ['./registro-actas.component.css'],
  standalone: false,
})
export class RegistroActasComponent implements OnInit {

  form = this._formBuilder.group({
    vigencia: ['', Validators.required],
    consecutivoContrato: ['', Validators.required],
    fechaSuscripcion: [''],
    tipoDocumento: [''],
    numeroDocumento: [''],
    nombreContratista: [''],
    valorContrato: [''],
    supervisor: [''],
    objeto: [''],
    numeroPoliza: [''],
    fechaExpedicion: [''],
    fechaAprobacionPoliza: [''],
    numeroRegistroPresupuestal: [''],
    valorRegistroPresupuestal: [''],
    fechaAprobacionRP: [''],
    plazo: [''],
    fechaInicio: [''],
    fechaTerminacion: [''],
  });

  contratosActivos: any[] = [];
  personaId: number | null = null; // Variable para almacenar el persona_id
  vigencias: string[] = [];
  camposFaltantes: string[] = [];
  variables: { [campo: string]: string } = {};
  prerrequisitosPendientes: string[] = [];
  rolActa: string | undefined;

  constructor(
    private _formBuilder: FormBuilder,
    private registroActasService: RegistroActasService,
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private contratoGeneralMidService: ContratoGeneralMidService,
    private proveedoresService: ProveedoresService,
    private snackBar: MatSnackBar,
    private userService: UserService 
  ) {}

  ngOnInit(): void {
    const anioActual = new Date().getFullYear();
    for (let anio = anioActual; anio >= 2023; anio--) {
      this.vigencias.push(anio.toString());
    }
    this.obtenerPersonaId();
    this.userService.getUserRoles()
      .then((roles) => (this.rolActa = roles.find((rol) => ROLES_ACTA_INICIO.includes(rol))))
      .catch(() => (this.rolActa = undefined));
    this.form.get('vigencia')?.valueChanges.subscribe(() => {
      this.cargarContratos();
    });
    this.form.get('consecutivoContrato')?.valueChanges.subscribe((value) => {
      if (value) this.cargarDatosActa(Number(value));
    });
    this.form.get('fechaInicio')?.valueChanges.subscribe((value) => {
      console.log('Fecha de inicio seleccionada:', value);
    });
    this.form.get('fechaTerminacion')?.valueChanges.subscribe((value) => {
      console.log('Fecha de terminación seleccionada:', value);
    });
  }
  
  obtenerPersonaId() {
    console.log('Valor de persona_id en localStorage antes de llamar al servicio:', localStorage.getItem('persona_id'));
    this.userService.getPersonaId()
      .then(id => {
        this.personaId = id;
        console.log('Persona ID:', this.personaId);
      })
      .catch(error => {
        this.snackBar.open('Error al obtener Persona ID', 'Cerrar', { duration: 2000 });
        console.error('Error al obtener Persona ID:', error);
      });
  }
  
  // Contratista consultado en Ágora (proveedores_mid) por número de documento
  buscarContratista() {
    const documento = this.form.value.numeroDocumento;
    if (!documento) return;
    this.proveedoresService.get(`contratistas?id=${documento}`).subscribe({
      next: (response: any) => {
        if (response?.Status !== 200) {
          this.snackBar.open(response?.Message || 'No se encontró el contratista', 'Cerrar', { duration: 2000 });
          return;
        }
        this.form.patchValue({ nombreContratista: response.Data.proveedor.nombre_completo_proveedor });
        this.cargarContratos();
      },
      error: () => this.snackBar.open('Error al buscar el contratista', 'Cerrar', { duration: 2000 }),
    });
  }

  // Contratos de la vigencia, filtrados por el contratista si ya se consultó
  cargarContratos() {
    const { vigencia, numeroDocumento } = this.form.value;
    this.contratosActivos = [];
    this.form.get('consecutivoContrato')?.setValue('', { emitEvent: false });
    if (!vigencia) return;
    const consulta = numeroDocumento
      ? this.contratoGeneralMidService.getContratos({ vigencia, contratista: { numero_documento: numeroDocumento } })
      : this.contratoGeneralCrudService.getContratosPorVigencia(vigencia);
    consulta.subscribe({
     next: (response: any) => {
        this.contratosActivos = (response?.Data ?? []).map((contrato: any) => contrato?.id ?? contrato);
        // Si el contratista tiene un solo contrato en la vigencia, se elige y se precarga
        if (numeroDocumento && this.contratosActivos.length === 1) {
          this.form.get('consecutivoContrato')?.setValue(this.contratosActivos[0].toString());
        }
      },
      error: () => this.snackBar.open('No se encontraron contratos para esta vigencia', 'Cerrar', { duration: 2000 }),
    });
  }

  // Datos del contrato consultados en minuta_contractual_mid
  cargarDatosActa(contratoId: number) {
    this.registroActasService.getPrecargaActaInicio(contratoId).subscribe({
      next: (response: any) => {
        if (!response?.Success) {
          this.snackBar.open(response?.Message || 'Error al consultar el contrato', 'Cerrar', { duration: 2000 });
          return;
        }
        const { datos, campos_faltantes, validacion } = response.Data;
        const valor = (campo: string) => (datos[campo] === 'XXXXXXX' ? '' : datos[campo]);
        const fecha = (campo: string) => (valor(campo) ? new Date(`${datos[campo]}T00:00:00`) : '');
        this.form.patchValue({
          numeroDocumento: valor('cedula_contratista'),
          nombreContratista: valor('nombre_contratista'),
          valorContrato: valor('valor_contrato'),
          supervisor: valor('nombre_supervisor'),
          objeto: valor('objeto_contrato'),
          numeroPoliza: valor('numero_poliza'),
          fechaExpedicion: fecha('fecha_expedicion_poliza'),
          fechaAprobacionPoliza: fecha('fecha_aprobacion_poliza'),
          plazo: valor('plazo_contrato'),
          fechaInicio: fecha('fecha_inicio'),
          fechaTerminacion: fecha('fecha_terminacion'),
        } as any);
        this.camposFaltantes = campos_faltantes ?? [];
        this.variables = {};
        this.prerrequisitosPendientes = (validacion?.prerrequisitos ?? [])
          .filter((item: any) => !item.cumple)
          .map((item: any) => item.descripcion);
      },
      error: () => this.snackBar.open('Error al consultar el contrato', 'Cerrar', { duration: 2000 }),
    });
  }

  // Datos del formulario para la plantilla del acta
  private datosActa() {
    const iso = (fecha: any) => (fecha ? new Date(fecha).toISOString().substring(0, 10) : undefined);
    const valorRegistro = Number(String(this.form.value.valorRegistroPresupuestal ?? '').replace(/\D/g, ''));
    return {
      fecha_suscripcion: iso(this.form.value.fechaSuscripcion),
      fecha_inicio: iso(this.form.value.fechaInicio),
      fecha_terminacion: iso(this.form.value.fechaTerminacion),
      valor_registro: valorRegistro || undefined,
      variables: {
        ...this.variables,
        certificado_registro: this.form.value.numeroRegistroPresupuestal || undefined,
      },
    };
  }

  // Vista previa del acta con los datos actuales del formulario
  previsualizarActa() {
    const contratoId = Number(this.form.value.consecutivoContrato);
    if (!contratoId) return;
    const ventana = abrirVentanaPdf('Vista previa del acta de inicio');
    if (!ventana) {
      this.snackBar.open('El navegador bloqueó la ventana emergente. Permítala e intente de nuevo.', 'Cerrar', { duration: 3000 });
      return;
    }
    this.registroActasService.previsualizarActaInicio(contratoId, this.datosActa()).subscribe({
      next: (response: any) => {
        if (!response?.Success) {
          ventana.close();
          this.snackBar.open(response?.Message || 'Error al generar la vista previa', 'Cerrar', { duration: 2000 });
          return;
        }
        mostrarPdfEnVentana(ventana, response.Data.pdf);
      },
      error: () => {
        ventana.close();
        this.snackBar.open('Error al generar la vista previa', 'Cerrar', { duration: 2000 });
      },
    });
  }

  registrarActaInicio() {
    if (this.form.invalid) {
      this.snackBar.open('Complete todos los campos obligatorios', 'Cerrar', { duration: 2000 });
      return;
    }

    const actaInicioData = {
      ...this.datosActa(),
      usuario_id: this.personaId,
      usuario_rol: this.rolActa,
    };

    this.registroActasService.generarActaInicio(Number(this.form.value.consecutivoContrato), actaInicioData).subscribe(
      (response) => {
        if (!response?.Success) {
          this.snackBar.open(response?.Message || 'Error al registrar el acta de inicio', 'Cerrar', { duration: 2000 });
          return;
        }
        this.snackBar.open('Acta de inicio registrada correctamente', 'Cerrar', { duration: 2000 });
        this.form.reset();
      },
      (error) => {
        this.snackBar.open('Error al registrar el acta de inicio', 'Cerrar', { duration: 2000 });
        console.error('Error al registrar el acta de inicio:', error);
      }
    );
  }  

}
