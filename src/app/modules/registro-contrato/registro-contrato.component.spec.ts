import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, QueryList } from '@angular/core';
import { RegistroContratoComponent } from './registro-contrato.component';

describe('RegistroContratoComponent', () => {
  let component: RegistroContratoComponent;
  let fixture: ComponentFixture<RegistroContratoComponent>;

  beforeEach(() => {
    RegistroContratoComponent.prototype.ngAfterViewInit = jest.fn();
    
    TestBed.configureTestingModule({
      declarations: [RegistroContratoComponent],
      schemas: [NO_ERRORS_SCHEMA]
    });
    
    fixture = TestBed.createComponent(RegistroContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
