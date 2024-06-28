import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoSupervisoresComponent } from './paso-supervisores.component';

describe('PasoSupervisoresComponent', () => {
  let component: PasoSupervisoresComponent;
  let fixture: ComponentFixture<PasoSupervisoresComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoSupervisoresComponent]
    });
    fixture = TestBed.createComponent(PasoSupervisoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
