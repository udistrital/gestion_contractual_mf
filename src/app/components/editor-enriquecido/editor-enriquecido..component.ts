import {ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR, ReactiveFormsModule} from "@angular/forms";
import {Component, forwardRef, Input, OnInit} from "@angular/core";
import {QuillEditorComponent} from "ngx-quill";
import Italic from "quill/formats/italic";

@Component({
  selector: 'app-editor-enriquecido',
  standalone: true,
  imports: [
    QuillEditorComponent,
    ReactiveFormsModule
  ],
  templateUrl: './editor-enriquecido.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EditorEnriquecidoComponent),
      multi: true
    }
  ],
  styles: [`
    quill-editor {
      height: 200px;
      width: 100%;
      margin-bottom: 20px;
    }
  `]
})
export class EditorEnriquecidoComponent implements OnInit, ControlValueAccessor {

  @Input() placeholder: string = 'Escribe aquí...';

  editorForm: FormGroup;
  onChanges: any = () => {};
  onTouch: any = () => {};
  
  private initialValue: string = '';
  private isInitialized: boolean = false;

  constructor(private fb: FormBuilder) {
    this.editorForm = this.fb.group({
      editorContent: ['']
    });
  }

  ngOnInit() {
    const editorContent = this.editorForm.get('editorContent');
    if (editorContent) {
      editorContent.valueChanges.subscribe((value) => {
        if (this.isInitialized && value !== this.initialValue) {
          this.editorForm.markAsDirty();
          this.onChanges(value);
          this.onTouch();
        } else {
          this.editorForm.markAsPristine();
        }
      });
    }
  }


  registerOnChange(fn: any): void {
    this.onChanges = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  writeValue(obj: any): void {
    if (obj !== undefined) {
      this.initialValue = obj;
      this.isInitialized = true;
      this.editorForm.patchValue({editorContent: obj}, {emitEvent: false});
      this.editorForm.markAsPristine();
    }
  }

  setDisabledState?(isDisabled: boolean): void {
    isDisabled ? this.editorForm.disable() : this.editorForm.enable();
  }

  protected readonly Italic = Italic;
}
