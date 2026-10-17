import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PasoContratistasComponent } from './paso-contratistas.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('PasoContratistasComponent', () => {
  let component: PasoContratistasComponent;
  let fixture: ComponentFixture<PasoContratistasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      declarations: [PasoContratistasComponent],
      schemas: [NO_ERRORS_SCHEMA]
    });
    fixture = TestBed.createComponent(PasoContratistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
