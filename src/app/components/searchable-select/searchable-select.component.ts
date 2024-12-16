import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { NgxMatSelectSearchModule } from "ngx-mat-select-search";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import {ParametroResponse} from "../../types/types";

interface SimpleItem {
  Id: number;
  Nombre: string;
}

interface NestedItem {
  LugarHijoId: {
    Id: number;
    Nombre: string;
  }
}

interface DependenciaItem {
  id: number;
  nombre: string;
}

type ItemType = SimpleItem | NestedItem | DependenciaItem | ParametroResponse;

@Component({
  selector: 'app-searchable-select',
  template: `
    <mat-form-field appearance="fill" class="w-100">
      <mat-label>{{label}}</mat-label>
      <mat-select [formControl]="controlValue" [required]="required" [disabled]="disabled">
        <mat-option>
          <ngx-mat-select-search
            [formControl]="searchCtrl"
            [placeholderLabel]="'Buscar ' + label.toLowerCase()"
            [noEntriesFoundLabel]="'No se encontraron resultados'"
            [showToggleAllCheckbox]="false"
            [hideClearSearchButton]="false">
          </ngx-mat-select-search>
        </mat-option>

        <mat-option *ngFor="let item of items" [value]="getValue(item)">
          {{getDisplayName(item)}}
        </mat-option>
      </mat-select>
      <mat-error *ngIf="controlValue.hasError('required')">
        Este campo es requerido
      </mat-error>
    </mat-form-field>
  `,
  styles: [`
    .w-100 {
      width: 100%;
    }
    ::ng-deep .mat-mdc-select-search-input {
      padding: 8px !important;
    }
    ::ng-deep .mat-mdc-select-search-inner {
      margin-bottom: 0 !important;
    }
    ::ng-deep .mat-mdc-select-panel {
      min-width: fit-content !important;
    }
  `],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    NgForOf,
    ReactiveFormsModule,
    NgIf
  ],
})
export class SearchableSelectComponent implements OnInit, OnDestroy {
  @Input() label: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;

  private _items: ItemType[] = [];
  @Input() set items(value: ItemType[]) {
    this._items = value || [];
    if (this.searchCtrl) {
      this.updateFilteredItems();
    }
  }
  get items(): ItemType[] {
    return this._filteredItems;
  }

  @Input() set control(value: AbstractControl | null) {
    if (value) {
      this.controlValue = value as FormControl;
      this.subscribeToValueChanges();
    }
  }

  controlValue: FormControl = new FormControl();
  searchCtrl = new FormControl('');
  private _filteredItems: ItemType[] = [];
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.searchCtrl.valueChanges
      .pipe(
        startWith(''),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateFilteredItems();
      });
  }

  private subscribeToValueChanges() {
    this.controlValue.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFilteredItems();
      });
  }

  private updateFilteredItems() {
    const search = this.searchCtrl.value?.toLowerCase() || '';
    this._filteredItems = this._items.filter(item => {
      if (!item) return false;
      if (!search) return true;
      const nombre = this.getDisplayName(item);
      return nombre.toLowerCase().includes(search);
    });
  }

  getValue(item: ItemType): string | number {
    if (this.isNestedItem(item)) {
      return item.LugarHijoId.Id;
    } else if (this.isDependenciaItem(item)) {
      return item.id;
    } else {
      return item.Id;
    }
  }

  getDisplayName(item: ItemType): string {
    if (this.isNestedItem(item)) {
      return item.LugarHijoId.Nombre;
    } else if (this.isDependenciaItem(item)) {
      return item.nombre;
    } else {
      return item.Nombre;
    }
  }

  isNestedItem(item: ItemType): item is NestedItem {
    return 'LugarHijoId' in item;
  }

  isDependenciaItem(item: ItemType): item is DependenciaItem {
    return 'nombre' in item && !('Nombre' in item);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
