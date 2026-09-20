import { Component, Input, TemplateRef } from "@angular/core";

@Component({
    selector: "plantilla-modal",
    templateUrl: "./plantilla-modal.component.html",
    styleUrl: "./plantilla-modal.component.css",
    standalone: false
})
export class PlantillaModalComponent {
  @Input() icono: string = "";
  @Input() titulo: string = "";
  @Input() descripcion: string = "";
  @Input() contenido!: TemplateRef<any>;
}
