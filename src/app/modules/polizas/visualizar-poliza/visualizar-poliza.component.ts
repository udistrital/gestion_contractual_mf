import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

export interface ContratoPoliza {
  contratoId: string;
  tienePoliza: boolean;
  amparos: string[];
}

@Component({
  selector: 'app-visualizar-polizas',
  templateUrl: './visualizar-poliza.component.html',
  styleUrls: ['./visualizar-poliza.component.css'],
  standalone: false
})
export class VisualizarPolizaComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource: MatTableDataSource<ContratoPoliza> = new MatTableDataSource<ContratoPoliza>([]);

  private contratos: ContratoPoliza[] = [
    {
      contratoId: '2024-001',
      tienePoliza: true,
      amparos: ['Fuerza Mayor', 'Daños', 'Uso Indebido']
    },
    {
      contratoId: '2024-002',
      tienePoliza: false,
      amparos: []
    },
    {
      contratoId: '2024-003',
      tienePoliza: true,
      amparos: ['Fuerza Mayor', 'Daños']
    }
  ];

  displayedColumns: string[] = ['contratoId', 'tienePoliza', 'amparos', 'detalles'];

  ngOnInit(): void {
    this.dataSource.data = this.contratos;
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  verDetalles(contrato: ContratoPoliza): void {
    console.log('Ver detalles del contrato:', contrato);
  }
}
