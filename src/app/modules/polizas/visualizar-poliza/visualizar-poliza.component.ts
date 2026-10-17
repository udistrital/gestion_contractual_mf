import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin, of } from 'rxjs';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { ContratoGeneralCrudService } from '../../../services/contrato-general-crud.service';
import { PolizasService } from '../../../services/polizas.service';
import { ModalDetallePolizaComponent } from './modal-detalle-poliza/modal-detalle-poliza.component';

export interface ContratoPoliza {
  contratoId: string;
  tienePoliza: boolean;
  amparos: string[];
}

const VIGENCIAS = ['2024', '2025', '2026'];

@Component({
  selector: 'app-visualizar-polizas',
  templateUrl: './visualizar-poliza.component.html',
  styleUrls: ['./visualizar-poliza.component.css'],
  standalone: false
})
export class VisualizarPolizaComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  dataSource: MatTableDataSource<ContratoPoliza> = new MatTableDataSource<ContratoPoliza>([]);
  displayedColumns: string[] = ['contratoId', 'tienePoliza', 'amparos', 'detalles'];
  isLoading = false;

  constructor(
    private contratoGeneralCrudService: ContratoGeneralCrudService,
    private polizasService: PolizasService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.cargarContratos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  private cargarContratos(): void {
    this.isLoading = true;

    const idsPorVigencia = VIGENCIAS.map((year) =>
      this.contratoGeneralCrudService.getContratosPorVigencia(year).pipe(
        map((response: any) => (response?.Data as number[]) || []),
        catchError(() => of([] as number[]))
      )
    );

    forkJoin(idsPorVigencia)
      .pipe(
        map((listas) => listas.flat()),
        mergeMap((ids) => {
          if (ids.length === 0) {
            return of([] as ContratoPoliza[]);
          }
          return forkJoin(ids.map((id) => this.cargarContratoPoliza(id)));
        })
      )
      .subscribe({
        next: (contratos) => {
          this.dataSource.data = contratos;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.showErrorMessage('Error al cargar los contratos con pólizas y amparos');
        },
      });
  }

  private cargarContratoPoliza(contratoId: number) {
    return this.polizasService.getAmparosContratoMid(contratoId).pipe(
      map((response: any) => {
        const amparos = (response?.Data as any[]) || [];
        return {
          contratoId: contratoId.toString(),
          tienePoliza: amparos.some((a) => !!a.poliza_id),
          amparos: amparos
            .map((a) => a.amparo)
            .filter((nombre): nombre is string => !!nombre),
        } as ContratoPoliza;
      }),
      catchError(() =>
        of({
          contratoId: contratoId.toString(),
          tienePoliza: false,
          amparos: [],
        } as ContratoPoliza)
      )
    );
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }

  verDetalles(contrato: ContratoPoliza): void {
    this.dialog.open(ModalDetallePolizaComponent, {
      width: '70vw',
      maxHeight: '80vh',
      data: { contratoId: contrato.contratoId },
    });
  }
}
