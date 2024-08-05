import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParagrafoDialogComponent } from './paragrafo-dialog.component';

describe('ParagrafoDialogComponent', () => {
  let component: ParagrafoDialogComponent;
  let fixture: ComponentFixture<ParagrafoDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ParagrafoDialogComponent]
    });
    fixture = TestBed.createComponent(ParagrafoDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
