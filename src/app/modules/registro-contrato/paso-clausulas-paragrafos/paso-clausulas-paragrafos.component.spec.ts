import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoClausulasParagrafosComponent } from './paso-clausulas-paragrafos.component';

describe('PasoClausulasParagrafosComponent', () => {
  let component: PasoClausulasParagrafosComponent;
  let fixture: ComponentFixture<PasoClausulasParagrafosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoClausulasParagrafosComponent]
    });
    fixture = TestBed.createComponent(PasoClausulasParagrafosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
