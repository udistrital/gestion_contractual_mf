import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { AlertService } from 'src/app/services/alert.service';
import { ContratoGeneralCrudService } from 'src/app/services/contrato-general-crud.service';

describe('ModalMotivosRechazoComponent', () => {
  let component: ModalMotivosRechazoComponent;
  let fixture: ComponentFixture<ModalMotivosRechazoComponent>;
  let showConfirmAlert: jest.Mock;
  let postEstadoContrato: jest.Mock;
  let close: jest.Mock;

  beforeEach(() => {
    showConfirmAlert = jest.fn().mockResolvedValue({ value: true, isConfirmed: true });
    postEstadoContrato = jest.fn().mockReturnValue(of({ Data: { id: 55 } }));
    close = jest.fn();
    TestBed.configureTestingModule({
      declarations: [ModalMotivosRechazoComponent],
      imports: [ReactiveFormsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { contrato_general_id: 31, usuario_id: 7, rol: 'JEFE_CONTRATACION_RECTOR' } },
        { provide: MatDialogRef, useValue: { close } },
        { provide: AlertService, useValue: { showConfirmAlert } },
        { provide: ContratoGeneralCrudService, useValue: { postEstadoContrato } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(ModalMotivosRechazoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => document.querySelectorAll('.cdk-overlay-popover').forEach((e) => e.remove()));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('dentro de un diálogo en la capa superior, la confirmación se agrega en ese mismo host', async () => {
    const host = document.createElement('div');
    host.classList.add('cdk-overlay-popover');
    document.body.appendChild(host);
    host.appendChild(fixture.nativeElement);

    component.formObservaciones.setValue({ observaciones: 'PRUEBA 397: falta el soporte' });
    component.preguntarConfirmacionRechazo();
    await fixture.whenStable();

    expect(showConfirmAlert).toHaveBeenCalledWith('¿Está seguro(a) de rechazar el contrato?', undefined, host);
  });

  it('sin capa superior (navegador sin popover), la confirmación va al body como antes', () => {
    component.preguntarConfirmacionRechazo();
    expect(showConfirmAlert).toHaveBeenCalledWith('¿Está seguro(a) de rechazar el contrato?', undefined, undefined);
  });

  it('al aceptar, registra el rechazo con el motivo y cierra el modal', async () => {
    component.formObservaciones.setValue({ observaciones: 'PRUEBA 397: falta el soporte' });
    component.preguntarConfirmacionRechazo();
    await fixture.whenStable();

    expect(postEstadoContrato).toHaveBeenCalledWith(
      expect.objectContaining({ contrato_general_id: { id: 31 }, motivo: 'PRUEBA 397: falta el soporte' })
    );
    expect(close).toHaveBeenCalledWith({ rechazado: true });
  });

  it('al cancelar, no registra nada', async () => {
    showConfirmAlert.mockResolvedValue({ value: false, isConfirmed: false });
    component.preguntarConfirmacionRechazo();
    await fixture.whenStable();
    expect(postEstadoContrato).not.toHaveBeenCalled();
  });
});
