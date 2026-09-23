import {ControlValueAccessor, FormBuilder, FormGroup, NG_VALUE_ACCESSOR} from "@angular/forms";
import {Component, forwardRef, Input, OnInit} from "@angular/core";

@Component({
    selector: 'app-editor-enriquecido',
    standalone: false,
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
  protected Italic: any;

  constructor(private fb: FormBuilder) {
    this.editorForm = this.fb.group({
      editorContent: ['']
    });
  }

  async ngOnInit() {
    try {
      const { default: italicFormat } = await import("quill/formats/italic");
      this.Italic = italicFormat;
    } catch (error) {
      console.error("No se pudo cargar el formato Italic dinámicamente", error);
    }

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
}
