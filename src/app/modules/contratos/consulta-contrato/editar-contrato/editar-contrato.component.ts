import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-editar-contrato',
  templateUrl: './editar-contrato.component.html',
  styleUrl: './editar-contrato.component.css',
  standalone: false
})
export class EditarContratoComponent implements OnInit {
  route = inject(ActivatedRoute);
  private cdRef = inject(ChangeDetectorRef);

  contratoGeneralId: number = 0;
  editMode: boolean = true;

  ngOnInit() {
    const extractId = (params: any): number => {
      const val =
        params?.get?.('contratoId') ||
        params?.get?.('idContrato') ||
        params?.get?.('id') ||
        params?.contratoId ||
        params?.idContrato ||
        params?.id;
      return val ? parseInt(val, 10) : 0;
    };

    const initialId =
      extractId(this.route?.snapshot?.paramMap) ||
      extractId(this.route?.parent?.snapshot?.paramMap) ||
      extractId(this.route?.snapshot?.params);

    if (initialId && initialId > 0) {
      this.contratoGeneralId = initialId;
    }

    this.route?.paramMap?.subscribe?.((params) => {
      const id = extractId(params);
      if (id && id > 0 && id !== this.contratoGeneralId) {
        this.contratoGeneralId = id;
        this.cdRef.detectChanges();
      }
    });
  }
}
