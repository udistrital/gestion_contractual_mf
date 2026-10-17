// Import estático a propósito: con import() la librería quedaba en un chunk
// aparte que, en la configuración production (sin deployUrl), se pide al
// origen del root y responde 404 bajo single-spa.
import { load } from '@fingerprintjs/fingerprintjs';
import { ProveedorHuella, ResultadoHuella } from '../huella-navegador.models';
import { ComponenteCrudo, hashComponentes } from '../utilidades/hash-componentes';

export class FingerprintjsProveedor implements ProveedorHuella {
  readonly nombre = 'fingerprintjs';

  async obtener(): Promise<ResultadoHuella> {
    // monitoring: false es obligatorio; si no, en una de cada mil cargas la
    // librería hace una petición a m1.openfpcdn.io (y con ella envía la IP y
    // los headers del usuario).
    const agente = await load({ monitoring: false });
    const resultado = await agente.get();

    const crudos: Record<string, ComponenteCrudo> = {};
    Object.entries(resultado.components).forEach(([nombre, componente]) => {
      crudos[nombre] =
        'error' in componente
          ? { error: true, duracion_ms: componente.duration }
          : { valor: componente.value, duracion_ms: componente.duration };
    });

    return {
      huella: resultado.visitorId,
      libreria: this.nombre,
      version_libreria: resultado.version,
      confianza: resultado.confidence.score,
      componentes: await hashComponentes(crudos),
    };
  }
}
