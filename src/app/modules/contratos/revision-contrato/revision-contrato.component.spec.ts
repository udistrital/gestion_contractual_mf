import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { RevisionContratoComponent as RevisionContratoComponent } from './revision-contrato.component';
import { GestorDocumentalService } from 'src/app/services/gestor-documental.service';

describe('RevisionContratoComponent', () => {
  let component: RevisionContratoComponent;
  let fixture: ComponentFixture<RevisionContratoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [RevisionContratoComponent],
      providers: [GestorDocumentalService] 
    });
    fixture = TestBed.createComponent(RevisionContratoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
