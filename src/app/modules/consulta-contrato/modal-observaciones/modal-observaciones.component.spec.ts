import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalObservacionesComponent as ModalObservacionesComponent } from './modal-observaciones.component';

describe('ModalObservacionesComponent', () => {
  let component: ModalObservacionesComponent;
  let fixture: ComponentFixture<ModalObservacionesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalObservacionesComponent],
    });
    fixture = TestBed.createComponent(ModalObservacionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
