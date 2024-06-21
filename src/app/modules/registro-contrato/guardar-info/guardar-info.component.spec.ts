import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuardarInfoComponent } from './guardar-info.component';

describe('GuardarInfoComponent', () => {
  let component: GuardarInfoComponent;
  let fixture: ComponentFixture<GuardarInfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GuardarInfoComponent]
    });
    fixture = TestBed.createComponent(GuardarInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
