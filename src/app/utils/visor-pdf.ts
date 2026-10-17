/**
 * Muestra un PDF en una ventana emergente con el visor nativo del navegador
 * (descargar, imprimir, buscar).
 *
 * La ventana debe abrirse dentro del manejador del clic, antes de pedir el
 * documento: si se abriera al llegar la respuesta, el navegador la bloquearía
 * como ventana emergente no solicitada.
 */
export function abrirVentanaPdf(titulo: string): Window | null {
  const ventana = window.open(
    '',
    '_blank',
    'popup=yes,width=900,height=700,left=150,top=60'
  );
  if (ventana) {
    ventana.document.title = titulo;
  }
  return ventana;
}

/** Carga el PDF (base64) en una ventana abierta con `abrirVentanaPdf`. */
export function mostrarPdfEnVentana(ventana: Window, base64: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(
    new Blob([bytes], { type: 'application/pdf' })
  );
  ventana.location.href = url;
  // El botón "Descargar" del visor vuelve a pedir esta URL, así que debe seguir
  // viva mientras la ventana esté abierta; se libera al cerrarla.
  const vigilante = setInterval(() => {
    if (ventana.closed) {
      URL.revokeObjectURL(url);
      clearInterval(vigilante);
    }
  }, 5000);
}
