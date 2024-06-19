import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoInfoGeneralComponent } from './paso-info-general.component';

describe('PasoInfoGeneralComponent', () => {
  let component: PasoInfoGeneralComponent;
  let fixture: ComponentFixture<PasoInfoGeneralComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PasoInfoGeneralComponent]
    });
    fixture = TestBed.createComponent(PasoInfoGeneralComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
