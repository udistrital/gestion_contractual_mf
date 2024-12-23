import { Component, OnInit } from '@angular/core';
import { RolService } from './services/rol.service';

@Component({
  selector: 'argo-gestion-contractual-mf',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'argo-gestion-contractual-mf';

  constructor(private rolService: RolService) {}

  ngOnInit(): void {
    this.rolService.cargarRol();
  }
}
