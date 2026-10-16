import { hashComponentes } from './hash-componentes';

// El tsconfig de pruebas no resuelve @types/node; se usa el módulo crypto de
// Node en tiempo de ejecución.
declare const require: (modulo: string) => any;
const { createHash, webcrypto } = require('crypto');

const sha256Truncado = (texto: string): string =>
  createHash('sha256').update(texto).digest('hex').slice(0, 16);

describe('hashComponentes', () => {
  const subtleOriginal = (globalThis.crypto as any)?.subtle;

  beforeAll(() => {
    // jsdom no trae crypto.subtle: se usa el de Node, que implementa la misma API.
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: webcrypto.subtle,
      configurable: true,
    });
  });

  afterAll(() => {
    Object.defineProperty(globalThis.crypto, 'subtle', {
      value: subtleOriginal,
      configurable: true,
    });
  });

  it('debería resumir cada valor con 16 caracteres hex del SHA-256 de su JSON', async () => {
    const resultado = await hashComponentes({
      timezone: { valor: 'America/Bogota', duracion_ms: 3 },
      pantalla: { valor: { ancho: 1920, alto: 1080 }, duracion_ms: 1 },
      cookies: { valor: true },
    });

    expect(resultado).toEqual({
      timezone: {
        hash: sha256Truncado('"America/Bogota"'),
        duracion_ms: 3,
        error: false,
      },
      pantalla: {
        hash: sha256Truncado('{"ancho":1920,"alto":1080}'),
        duracion_ms: 1,
        error: false,
      },
      cookies: { hash: sha256Truncado('true'), duracion_ms: null, error: false },
    });
    Object.values(resultado).forEach((componente) =>
      expect(componente.hash).toMatch(/^[0-9a-f]{16}$/),
    );
  });

  it('debería marcar el componente con error y sin hash cuando la librería falló', async () => {
    const resultado = await hashComponentes({
      audio: { error: true, duracion_ms: 40 },
    });

    expect(resultado).toEqual({
      audio: { hash: null, duracion_ms: 40, error: true },
    });
  });

  it('no debería incluir los valores crudos en el resultado', async () => {
    const valorCrudo = 'data:image/png;base64,AAAA-muy-identificador';
    const resultado = await hashComponentes({ canvas: { valor: valorCrudo } });

    expect(JSON.stringify(resultado)).not.toContain(valorCrudo);
  });

  it('debería marcar error si no se puede calcular el hash', async () => {
    const digest = jest
      .spyOn(webcrypto.subtle, 'digest')
      .mockRejectedValueOnce(new Error('contexto no seguro'));

    const resultado = await hashComponentes({ fuentes: { valor: ['Arial'] } });

    expect(resultado['fuentes']).toEqual({ hash: null, duracion_ms: null, error: true });
    digest.mockRestore();
  });
});
