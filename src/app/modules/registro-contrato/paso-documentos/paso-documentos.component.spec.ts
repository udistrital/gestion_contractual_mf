import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasoDocumentosComponent } from './paso-documentos.component';

describe('PasoDocumentosComponent', () => {
  let component: PasoDocumentosComponent;
  let fixture: ComponentFixture<PasoDocumentosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PasoDocumentosComponent]
    });
    fixture = TestBed.createComponent(PasoDocumentosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
