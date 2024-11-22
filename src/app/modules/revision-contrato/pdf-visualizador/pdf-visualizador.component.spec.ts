import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PdfVisualizadorComponent } from './pdf-visualizador.component';

describe('PdfVisualizadorComponent', () => {
  let component: PdfVisualizadorComponent;
  let fixture: ComponentFixture<PdfVisualizadorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PdfVisualizadorComponent],
    });
    fixture = TestBed.createComponent(PdfVisualizadorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
