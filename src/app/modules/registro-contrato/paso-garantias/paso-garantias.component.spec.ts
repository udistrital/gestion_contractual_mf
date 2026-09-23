import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoGarantiasComponent } from './paso-garantias.component';
import { ParametrosService } from 'src/app/services/parametros.service';

describe('PasoGarantiasComponent', () => {
  let component: PasoGarantiasComponent;
  let fixture: ComponentFixture<PasoGarantiasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoGarantiasComponent],
      providers: [ParametrosService],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(PasoGarantiasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
