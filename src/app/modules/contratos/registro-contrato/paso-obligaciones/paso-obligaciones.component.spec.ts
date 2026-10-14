import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { PasoObligacionesComponent } from './paso-obligaciones.component';

describe('PasoObligacionesComponent', () => {
  let component: PasoObligacionesComponent;
  let fixture: ComponentFixture<PasoObligacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoObligacionesComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(PasoObligacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
