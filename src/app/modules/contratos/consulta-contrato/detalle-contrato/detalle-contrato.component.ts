import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Detalle del contrato en solo lectura: reutiliza el stepper de
 * RegistroContratoComponent en modo visualización.
 */
@Component({
  selector: 'app-detalle-contrato',
  templateUrl: './detalle-contrato.component.html',
  styleUrl: './detalle-contrato.component.css',
  standalone: false
})
export class DetalleContratoComponent implements OnInit {
  route = inject(ActivatedRoute)

  contratoGeneralId: number = 0;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const contratoIdParam = params.get('contratoId');
      if (contratoIdParam) {
        this.contratoGeneralId = parseInt(contratoIdParam, 10);
      }
    });
  }

}
