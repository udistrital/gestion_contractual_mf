import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarContratoComponent } from './editar-contrato.component';

describe('EditarContratoComponent', () => {
  let component: EditarContratoComponent;
  let fixture: ComponentFixture<EditarContratoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarContratoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
