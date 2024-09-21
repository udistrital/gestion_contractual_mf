import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { ParametrosService } from 'src/app/services/parametros.service';
import { ClausulasParagrafosService } from 'src/app/services/clausulas-paragrafos.service';
import { environment } from 'src/environments/environment';
import { forkJoin, from, Observable } from 'rxjs';
import { map, mergeMap, toArray, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-paso-clausulas-paragrafos',
  templateUrl: './paso-clausulas-paragrafos.component.html',
  styleUrls: ['./paso-clausulas-paragrafos.component.css']
})
export class PasoClausulasParagrafosComponent {
  form: FormGroup;
  index: any[] = [];
  contratoId: string = 'contrato-quemado-123';

  constructor(
    private _formBuilder: FormBuilder,
    private parametrosService: ParametrosService,
    private clausulasParagrafosService: ClausulasParagrafosService
  ) {
    this.form = this._formBuilder.group({
      clausulas: this._formBuilder.array([this.crearClausula()])
    });
  }

  ngOnInit(): void {
    this.CargarClausulas();
  }

  get clausulas(): FormArray {
    return this.form.get('clausulas') as FormArray;
  }

  crearClausula(): FormGroup {
    return this._formBuilder.group({
      index: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      paragrafos: this._formBuilder.array([])
    });
  }

  getParagrafos(clausula: AbstractControl): FormArray {
    return clausula.get('paragrafos') as FormArray;
  }

  agregarClausula() {
    this.clausulas.push(this.crearClausula());
  }

  eliminarClausula(index: number) {
    if (this.clausulas.length > 1) {
      this.clausulas.removeAt(index);
    }
  }

  agregarParagrafo(clausulaIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.push(this._formBuilder.group({
      descripcion: ['', Validators.required]
    }));
  }

  eliminarParagrafo(clausulaIndex: number, paragrafoIndex: number) {
    const paragrafos = this.getParagrafos(this.clausulas.at(clausulaIndex));
    paragrafos.removeAt(paragrafoIndex);
  }

  guardarYContinuar() {
    if (this.form.valid) {
      const clausulas = this.form.value.clausulas;
      
      from(clausulas).pipe(
        mergeMap((clausula: any) => this.crearClausulaConParagrafos(clausula)),
        toArray(),
        mergeMap((clausulasCreadas: any[]) => {
          const ordenClausulas = clausulasCreadas.map(c => c.clausula._id);
          return this.crearOrdenClausulas(ordenClausulas);
        }),
        catchError(this.manejarError)
      ).subscribe(
        () => {
          console.log('Datos guardados exitosamente');
          // Aquí se puede agregar lógica adicional después de guardar exitosamente
        },
        (error) => {
          console.error('Error al guardar los datos:', error);
          // Aquí se puede manejar el error, por ejemplo, mostrando un mensaje al usuario
        }
      );
    } else {
      console.error('Formulario inválido');
      // Aquí se puede agregar lógica para mostrar errores de validación al usuario
    }
  }

  private crearClausulaConParagrafos(clausula: any): Observable<any> {
    return this.clausulasParagrafosService.post('clausulas', {
      nombre: clausula.nombre,
      descripcion: clausula.descripcion,
      predeterminado: false,
      activo: true
    }).pipe(
      mergeMap((nuevaClausula: any) => {
        return from(clausula.paragrafos).pipe(
          mergeMap((paragrafo: any) => this.crearParagrafo(paragrafo)),
          toArray(),
          mergeMap((paragrafosCreados: any[]) => {
            const paragrafoIds = paragrafosCreados.map(p => p._id);
            return this.crearOrdenParagrafos(nuevaClausula.Data._id, paragrafoIds).pipe(
              map(() => ({ clausula: nuevaClausula.Data, paragrafos: paragrafosCreados }))
            );
          })
        );
      })
    );
  }

  private crearParagrafo(paragrafo: any): Observable<any> {
    return this.clausulasParagrafosService.post('paragrafos', {
      descripcion: paragrafo.descripcion,
      predeterminado: false,
      activo: true
    }).pipe(
      map((response: any) => response.Data)
    );
  }

  private crearOrdenParagrafos(clausulaId: string, paragrafoIds: string[]): Observable<any> {
    return this.clausulasParagrafosService.post('orden-paragrafos', {
      paragrafo_ids: paragrafoIds,
      contrato_id: this.contratoId,
      clausula_id: clausulaId
    });
  }

  private crearOrdenClausulas(clausulaIds: string[]): Observable<any> {
    return this.clausulasParagrafosService.post('orden-clausulas', {
      clausula_ids: clausulaIds,
      contrato_id: this.contratoId
    });
  }

  private manejarError(error: any): Observable<never> {
    let errorMessage = 'Ocurrió un error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // El backend retornó un código de error
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    console.error(errorMessage);
    return new Observable(observer => observer.error(errorMessage));
  }

  CargarClausulas() {
    this.parametrosService.get('parametro?query=TipoParametroId:' + environment.ENUMERACION_CLAUSULAS_ID + '&limit=0').subscribe(
      (Response: any) => {
        if (Response.Status == "200") {
          this.index = Response.Data;
        }
      },
      error => {
        console.error('Error al cargar cláusulas:', error);
      }
    );
  }
}