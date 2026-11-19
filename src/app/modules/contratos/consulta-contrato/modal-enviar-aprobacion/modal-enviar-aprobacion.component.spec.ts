import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { ModalEnviarAprobacionComponent } from './modal-enviar-aprobacion.component';

describe('ModalEnviarAprobacionComponent', () => {
  let component: ModalEnviarAprobacionComponent;
  let fixture: ComponentFixture<ModalEnviarAprobacionComponent>;

  const mockDialogRef = {
    close: jest.fn(),
  };

  const mockData = {
    contrato: {
      id: 101,
      numero_contrato: 'CT-2026-101',
      vigencia: '2026',
      valor_pesos: 55000000,
      contratista: {
        nombre_completo: 'Contratista Cinco de Prueba',
      },
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModalEnviarAprobacionComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalEnviarAprobacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe extraer el número de contrato correctamente', () => {
    expect(component.numeroContrato).toBe('CT-2026-101');
  });

  it('debe extraer el nombre del contratista', () => {
    expect(component.nombreContratista).toBe('Contratista Cinco de Prueba');
  });

  it('debe formatear el valor del contrato en pesos', () => {
    expect(component.valorContrato).toContain('55.000.000');
  });

  it('debe cerrar con confirmado=false al pulsar cancelar()', () => {
    component.cancelar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmado: false });
  });

  it('debe cerrar con confirmado=true y la observación al pulsar confirmar()', () => {
    component.observacion = '  Revisión prioritaria de pólizas y CDP  ';
    component.confirmar();
    expect(mockDialogRef.close).toHaveBeenCalledWith({
      confirmado: true,
      observacion: 'Revisión prioritaria de pólizas y CDP',
    });
  });

  describe('con envío (minuta vigente y estado, #405)', () => {
    let envio: Subject<unknown>;
    let enviar: jest.Mock;
    const botones = () =>
      Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const botonConfirmar = () =>
      fixture.nativeElement.querySelector('.btn-confirmar') as HTMLButtonElement;

    beforeEach(() => {
      envio = new Subject<unknown>();
      enviar = jest.fn(() => envio.asObservable());
      component.data = { ...mockData, enviar } as any;
      component.observacion = '  nota  ';
    });

    it('mientras envía: el modal sigue abierto, los botones quedan deshabilitados y "Confirmar" muestra la carga', () => {
      component.confirmar();
      fixture.detectChanges();

      expect(enviar).toHaveBeenCalledWith('nota');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(botonConfirmar().textContent).toContain('Generando minuta y enviando…');
      expect(botones().every((b) => b.disabled)).toBe(true);
      expect((mockDialogRef as any).disableClose).toBe(true);

      component.cancelar();
      component.confirmar();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(enviar).toHaveBeenCalledTimes(1);
    });

    it('si el envío termina bien, se cierra con enviado', () => {
      component.confirmar();
      envio.next(undefined);
      envio.complete();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ confirmado: true, observacion: 'nota', enviado: true });
    });

    it('si el envío falla, el modal sigue abierto, muestra el motivo y el botón se libera para reintentar', () => {
      component.confirmar();
      envio.error({ mensaje: 'No se pudo enviar el contrato. Faltan datos en el paso General y Presupuestal: ordenador del gasto.' });
      fixture.detectChanges();

      const alerta = fixture.nativeElement.querySelector('.mensaje-error[role="alert"]') as HTMLElement;
      expect(alerta.textContent).toContain(
        'No se pudo enviar el contrato. Faltan datos en el paso General y Presupuestal: ordenador del gasto.'
      );
      expect(mockDialogRef.close).not.toHaveBeenCalled();
      expect(component.enviando).toBe(false);
      expect((mockDialogRef as any).disableClose).toBe(false);
      expect(botonConfirmar().disabled).toBe(false);
      expect(botonConfirmar().textContent).toContain('Confirmar y Enviar');
    });

    it('un error sin mensaje muestra el texto genérico, y al reintentar se limpia', () => {
      component.confirmar();
      envio.error(new Error('boom'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.mensaje-error').textContent).toContain(
        'No fue posible enviar el contrato para aprobación.'
      );

      envio = new Subject<unknown>();
      component.confirmar();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.mensaje-error')).toBeNull();
    });
  });

  it('debe manejar fallback cuando no hay datos de contratista o número', () => {
    component.data = { contrato: {} as any };
    expect(component.numeroContrato).toBe('Sin número');
    expect(component.nombreContratista).toBe('No registrado');
    expect(component.valorContrato).toBe('$ 0');
  });
});
