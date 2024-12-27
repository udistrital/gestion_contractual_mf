import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import {AbstractControl, FormControl, ReactiveFormsModule} from '@angular/forms';
import { Subject } from 'rxjs';
import { startWith, takeUntil } from 'rxjs/operators';
import {MatFormFieldModule} from "@angular/material/form-field";
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {NgxMatSelectSearchModule} from "ngx-mat-select-search";
import {NgForOf, NgIf} from "@angular/common";
import {DependenciaItem, NestedItem, ParametroResponse, SimpleItem} from "../../types/types";

export type ItemType = SimpleItem | NestedItem | DependenciaItem | ParametroResponse;

@Component({
  selector: 'app-searchable-select',
  templateUrl: './searchable-select.component.html',
  styleUrls: ['./searchable-select.component.scss'],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    NgxMatSelectSearchModule,
    NgForOf,
    ReactiveFormsModule,
    NgIf,
  ],
})
export class SearchableSelectComponent implements OnInit, OnDestroy, OnChanges {
  @Input() label: string = '';
  @Input() icon: string = '';
  @Input() required: boolean = false;

  @Input() set disabled(value: boolean) {
    if (value) {
      this.controlValue.disable({emitEvent: false});
    } else {
      this.controlValue.enable({emitEvent: false});
    }
  }

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
      if (this.disabled) {
        this.controlValue.disable({emitEvent: false});
      }
      this.subscribeToValueChanges();
    }
  }

  controlValue: FormControl = new FormControl({
    value: null,
    disabled: this.disabled
  });

  searchCtrl = new FormControl('');
  private _filteredItems: ItemType[] = [];
  private destroy$ = new Subject<void>();
  selectedItem: ItemType | null = null;

  ngOnInit() {
    this.searchCtrl.valueChanges
      .pipe(startWith(''), takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateFilteredItems();
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.handleItemsChange();
    }
  }

  private handleItemsChange() {
    if (this._items && this._items.length === 1 && !this.disabled) {
      this.selectedItem = this._items[0];
      this.controlValue.setValue(this.getValue(this._items[0]));
      this.controlValue.disable({emitEvent: false});
    } else if (!this._items?.length) {
      this.controlValue.disable({emitEvent: false});
    } else {
      this.controlValue.enable({emitEvent: false});
    }
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
    this._filteredItems = this._items.filter((item) => {
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
