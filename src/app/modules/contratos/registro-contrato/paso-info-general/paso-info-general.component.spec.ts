import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoInfoGeneralComponent } from './paso-info-general.component';
import { ParametrosService } from 'src/app/services/parametros.service';

describe('PasoInfoGeneralComponent', () => {
  let component: PasoInfoGeneralComponent;
  let fixture: ComponentFixture<PasoInfoGeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoInfoGeneralComponent],
      providers: [ParametrosService],
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
