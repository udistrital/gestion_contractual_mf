import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GestionContractualCrudService } from 'src/app/services/gestion-contractual-crud.service';
import { UserService } from 'src/app/services/user.service';
import { CommonModule } from '@angular/common';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';

import { MatDividerModule } from '@angular/material/divider';
import { SharedModule } from 'src/app/shared/shared.module';

@Component({
  selector: 'app-registro-actas',
  templateUrl: './registro-actas.component.html',
  styleUrls: ['./registro-actas.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatDividerModule,
    SharedModule
  ]
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

  constructor(
    private _formBuilder: FormBuilder,
    private gestionContractualService: GestionContractualCrudService,
    private snackBar: MatSnackBar,
    private userService: UserService 
  ) {}

  ngOnInit(): void {
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
  
  registrarActaInicio() {
    if (this.form.invalid) {
      this.snackBar.open('Complete todos los campos obligatorios', 'Cerrar', { duration: 2000 });
      return;
    }
  
    // Construir el objeto con los datos necesarios
    const actaInicioData = {
      usuario_id: this.personaId, // ID del usuario desde localStorage
      fecha_inicio: this.form.value.fechaInicio, // Fecha de inicio desde el formulario
      fecha_fin: this.form.value.fechaTerminacion, // Fecha de terminación desde el formulario
      contrato_general_id: 123, // ID de contrato "quemado"
      activo: true, // Campo booleano que puede ser fijo
      fecha_creacion: new Date(), // Fecha de creación actual
      descripcion: 'Acta de inicio generada desde el formulario', // Descripción fija o personalizada
      // Puedes añadir otros campos necesarios aquí
    };
  
    console.log('Datos a enviar al API:', actaInicioData); // Verifica los datos antes de enviarlos
  
    // Llamada al servicio para registrar el acta de inicio
    this.gestionContractualService.registrarActaInicio(actaInicioData).subscribe(
      (response) => {
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
