import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalMotivosRechazoComponent } from './modal-motivos-rechazo.component';

describe('ModalMotivosRechazoComponent', () => {
  let component: ModalMotivosRechazoComponent;
  let fixture: ComponentFixture<ModalMotivosRechazoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ModalMotivosRechazoComponent],
    });
    fixture = TestBed.createComponent(ModalMotivosRechazoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
