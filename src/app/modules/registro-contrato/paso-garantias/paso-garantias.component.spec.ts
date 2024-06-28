import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoGarantiasComponent } from './paso-garantias.component';

describe('PasoGarantiasComponent', () => {
  let component: PasoGarantiasComponent;
  let fixture: ComponentFixture<PasoGarantiasComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoGarantiasComponent]
    });
    fixture = TestBed.createComponent(PasoGarantiasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
