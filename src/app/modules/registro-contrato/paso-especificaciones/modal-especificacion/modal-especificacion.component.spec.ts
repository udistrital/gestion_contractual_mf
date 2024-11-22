import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalEspecificacionComponent as ModalEspecificacionComponent } from './modal-especificacion.component';

describe('ModalEspecificacionComponent', () => {
  let component: ModalEspecificacionComponent;
  let fixture: ComponentFixture<ModalEspecificacionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalEspecificacionComponent],
    });
    fixture = TestBed.createComponent(ModalEspecificacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
