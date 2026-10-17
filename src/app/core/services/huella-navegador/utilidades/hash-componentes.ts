import { ComponenteHuella } from '../huella-navegador.models';

/** Componente tal como lo entrega la librería, antes de resumirlo. */
export interface ComponenteCrudo {
  valor?: unknown;
  error?: boolean;
  duracion_ms?: number | null;
}

const LONGITUD_HASH = 16;

/**
 * Resume cada componente con los primeros 16 caracteres hex del SHA-256 de su
 * valor. Los valores crudos (canvas, fuentes, etc.) no salen del navegador:
 * pueden ser muy grandes y muy identificadores.
 */
export async function hashComponentes(
  componentes: Record<string, ComponenteCrudo>,
): Promise<Record<string, ComponenteHuella>> {
  const entradas = await Promise.all(
    Object.entries(componentes).map(
      async ([nombre, componente]): Promise<[string, ComponenteHuella]> => {
        const duracion_ms = componente.duracion_ms ?? null;
        if (componente.error) {
          return [nombre, { hash: null, duracion_ms, error: true }];
        }
        try {
          const hash = await sha256Truncado(componente.valor);
          return [nombre, { hash, duracion_ms, error: false }];
        } catch {
          return [nombre, { hash: null, duracion_ms, error: true }];
        }
      },
    ),
  );
  return Object.fromEntries(entradas);
}

async function sha256Truncado(valor: unknown): Promise<string> {
  const texto = JSON.stringify(valor) ?? String(valor);
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(texto),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, LONGITUD_HASH);
}
