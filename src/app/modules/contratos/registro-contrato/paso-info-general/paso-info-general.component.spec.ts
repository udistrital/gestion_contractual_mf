import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoGeneralComponent } from './paso-info-general.component';
import { ParametrosService } from 'src/app/services/parametros.service';
import { AlertService } from 'src/app/services/alert.service';

import { of } from 'rxjs';

describe('PasoInfoGeneralComponent', () => {
  let component: PasoInfoGeneralComponent;
  let fixture: ComponentFixture<PasoInfoGeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoInfoGeneralComponent],
      providers: [
        {
          provide: ParametrosService,
          useValue: {
            get: jest.fn().mockReturnValue(of({ Status: '200', Data: { Id: 1, Data: [] } })),
          },
        },
        {
          provide: AlertService,
          useValue: {
            showErrorAlert: jest.fn(),
            showSuccessAlert: jest.fn(),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoInfoGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
