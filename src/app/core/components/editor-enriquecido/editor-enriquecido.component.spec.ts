import { FormBuilder } from '@angular/forms';
import { EditorEnriquecidoComponent } from './editor-enriquecido.component';

describe('EditorEnriquecidoComponent', () => {
  it('con el control deshabilitado queda en solo lectura', () => {
    const editor = new EditorEnriquecidoComponent(new FormBuilder());
    editor.setDisabledState!(true);
    expect(editor.soloLectura).toBe(true);
    expect(editor.editorForm.disabled).toBe(true);
  });

  it('con el control habilitado se puede editar', () => {
    const editor = new EditorEnriquecidoComponent(new FormBuilder());
    editor.setDisabledState!(true);
    editor.setDisabledState!(false);
    expect(editor.soloLectura).toBe(false);
    expect(editor.editorForm.enabled).toBe(true);
  });
});
