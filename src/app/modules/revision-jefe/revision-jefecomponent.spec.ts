import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionJefeComponent } from './revision-jefe.component';

describe('RevisionJefeComponent', () => {
  let component: RevisionJefeComponent;
  let fixture: ComponentFixture<RevisionJefeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RevisionJefeComponent]
    });
    fixture = TestBed.createComponent(RevisionJefeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
