import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-editar-contrato',
  templateUrl: './editar-contrato.component.html',
  styleUrl: './editar-contrato.component.css',
  standalone: false
})
export class EditarContratoComponent implements OnInit {
  route = inject(ActivatedRoute)

  contratoGeneralId: number = 0;
  editMode: boolean = true;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const contratoIdParam = params.get('contratoId');
      if (contratoIdParam) {
        this.contratoGeneralId = parseInt(contratoIdParam, 10);
      }
    });
  }

}
