import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ParametrosService } from 'src/app/services/parametros.service';
import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { MatStepper } from '@angular/material/stepper';

describe('PasoClausulasParagrafosComponent', () => {
  let component: PasoClausulasParagrafosComponent;
  let fixture: ComponentFixture<PasoClausulasParagrafosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoClausulasParagrafosComponent],
      providers: [
        ParametrosService,
        { provide: MatStepper, useValue: { _getStepLabelId: () => '', steps: { toArray: () => [] } } }
      ],
      schemas: [NO_ERRORS_SCHEMA] 
    });
    fixture = TestBed.createComponent(PasoClausulasParagrafosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
