import {Component, ElementRef, Inject, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import {FileService} from "../../../services/FileService";

@Component({
  selector: 'app-pdf-viewer-modal',
  templateUrl: './pdf-viewer-modal.component.html',
  styleUrls: ['./pdf-viewer-modal.component.css']
})
export class PdfViewerModalComponent implements OnInit {

  @ViewChild('pdfCanvas', { static: true }) pdfCanvas!: ElementRef<HTMLCanvasElement>;

  pdfLoaded = false;
  pdfSrc: Uint8Array | undefined;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { file: File },
    private fileService: FileService,
  ) {}

  async ngOnInit() {
    this.loadPdf();
  }

  async loadPdf() {
    try {
      const arrayBuffer = await this.fileService.readFileAsArrayBuffer(this.data.file);
      this.pdfSrc = new Uint8Array(arrayBuffer);
      this.pdfLoaded = true;
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }
}
