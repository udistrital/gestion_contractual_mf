import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegistroActasComponent } from './registro-actas.component';

describe('RegistroActasComponent', () => {
  let component: RegistroActasComponent;
  let fixture: ComponentFixture<RegistroActasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RegistroActasComponent],
      schemas: [NO_ERRORS_SCHEMA],
      declarations: []
    });
    fixture = TestBed.createComponent(RegistroActasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
