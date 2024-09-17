import {FormBuilder, FormGroup, ReactiveFormsModule} from "@angular/forms";
import {Component, OnInit} from "@angular/core";
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
  styles: [`
    quill-editor {
      height: 200px;
      margin-bottom: 20px;
    }
    .preview {
      border: 1px solid #ccc;
      padding: 10px;
      background-color: #f9f9f9;
    }
  `]
})
export class EditorEnriquecidoComponent implements OnInit {
  editorForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.editorForm = this.fb.group({
      editorContent: ['']
    });
  }

  ngOnInit() {
  }

  protected readonly Italic = Italic;
}
