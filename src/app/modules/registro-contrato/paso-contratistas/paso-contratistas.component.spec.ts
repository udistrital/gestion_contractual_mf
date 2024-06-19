import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoContratistasComponent } from './paso-contratistas.component';

describe('PasoContratistasComponent', () => {
  let component: PasoContratistasComponent;
  let fixture: ComponentFixture<PasoContratistasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoContratistasComponent]
    });
    fixture = TestBed.createComponent(PasoContratistasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
