import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoObjetoComponent } from './paso-objeto.component';

describe('PasoObjetoComponent', () => {
  let component: PasoObjetoComponent;
  let fixture: ComponentFixture<PasoObjetoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoObjetoComponent]
    });
    fixture = TestBed.createComponent(PasoObjetoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
