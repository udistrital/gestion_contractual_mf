import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { GuardarInfoComponent } from './guardar-info.component';

describe('GuardarInfoComponent', () => {
  let component: GuardarInfoComponent;
  let fixture: ComponentFixture<GuardarInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuardarInfoComponent],
      schemas: [NO_ERRORS_SCHEMA],
    });
    fixture = TestBed.createComponent(GuardarInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
