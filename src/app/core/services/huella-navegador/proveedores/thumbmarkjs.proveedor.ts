// Import estático a propósito: con import() la librería quedaba en un chunk
// aparte que, en la configuración production (sin deployUrl), se pide al
// origen del root y responde 404 bajo single-spa.
import { Thumbmark } from '@thumbmarkjs/thumbmarkjs';
import { ProveedorHuella, ResultadoHuella } from '../huella-navegador.models';
import { ComponenteCrudo, hashComponentes } from '../utilidades/hash-componentes';

export class ThumbmarkjsProveedor implements ProveedorHuella {
  readonly nombre = 'thumbmarkjs';

  async obtener(): Promise<ResultadoHuella> {
    // logging: false es obligatorio. Con el valor por defecto, en el 0,01 % de
    // las ejecuciones envía los componentes y la ruta a api.thumbmarkjs.com y
    // descarga y evalúa un script remoto, lo que la CSP del root permite
    // ('unsafe-eval' y https:). collect_beacon solo actúa con api_key, pero se
    // apaga también para no depender de eso.
    const thumbmark = new Thumbmark({
      logging: false,
      collect_beacon: false,
      performance: true,
    });
    const resultado = await thumbmark.get();

    const tiempos = resultado.elapsed ?? {};
    const conError = new Set(
      (resultado.error ?? [])
        .map((error) => error.component)
        .filter((nombre): nombre is string => !!nombre),
    );

    const crudos: Record<string, ComponenteCrudo> = {};
    Object.entries(resultado.components).forEach(([nombre, valor]) => {
      crudos[nombre] = {
        valor,
        error: conError.has(nombre),
        duracion_ms: tiempos[nombre] ?? null,
      };
    });
    conError.forEach((nombre) => {
      crudos[nombre] ??= { error: true, duracion_ms: tiempos[nombre] ?? null };
    });

    return {
      huella: resultado.thumbmark,
      libreria: this.nombre,
      version_libreria: resultado.version,
      confianza: null,
      componentes: await hashComponentes(crudos),
    };
  }
}
