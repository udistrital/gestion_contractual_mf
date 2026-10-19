import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { EditarContratoComponent } from './editar-contrato.component';

describe('EditarContratoComponent', () => {
  let component: EditarContratoComponent;
  let fixture: ComponentFixture<EditarContratoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditarContratoComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ contratoId: '123' }))
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
