import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionContratoComponent as RevisionContratoComponent } from './revision-contrato.component';

describe('RevisionContratoComponent', () => {
  let component: RevisionContratoComponent;
  let fixture: ComponentFixture<RevisionContratoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RevisionContratoComponent]
    });
    fixture = TestBed.createComponent(RevisionContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
